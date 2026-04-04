import type { RouteConfigInfo, RouteIgnoreInfo, RouteSkipInfo } from './dev/scanner'
import type { RouteTable } from './dev/types'

import type {
  FetchServerOptionsInput,
} from './fetch-options'
import { buildDiagnosticSummaryLines, createDiagnosticError, routeDiagnosticCatalog } from '@mokup/shared/diagnostics'
import { relative } from '@mokup/shared/pathe'
import { createLogger } from './dev/logger'
import { resolvePlaygroundOptions } from './dev/playground'
import { sortRoutes } from './dev/routes'
import { scanRoutes } from './dev/scanner'
import { createDebouncer, resolveDirs } from './dev/utils'
import { buildFetchServerApp } from './fetch-server/app'
import { normalizeOptions, resolveAllDirs, resolveRoot } from './fetch-server/options'
import { createPlaygroundWs } from './fetch-server/playground-ws'
import { createWatcher } from './fetch-server/watcher'

const unsupportedFieldsWarningRE = /^Skip mock with unsupported fields .*: (.+)$/
const missingHandlerWarningRE = /^Skip mock without handler: (.+)$/
const duplicateRouteWarningRE = /^Duplicate mock route (.+) from .+$/
const diagnosticErrorTitle = 'Mokup diagnostics error:'

export type {
  FetchServerOptions,
  FetchServerOptionsConfig,
  FetchServerOptionsInput,
} from './fetch-options'

/**
 * Fetch server instance returned by createFetchServer.
 *
 * @example
 * import type { FetchServer } from '@mokup/server'
 *
 * const server: FetchServer = {
 *   fetch: async () => new Response('ok'),
 *   refresh: async () => {},
 *   getRoutes: () => [],
 * }
 */
export interface FetchServer {
  /** Fetch handler for runtime requests. */
  fetch: (request: Request) => Promise<Response>
  /** Refresh the route table. */
  refresh: () => Promise<void>
  /** Read the current route table. */
  getRoutes: () => RouteTable
  /** Inject a WebSocket server for playground metrics. */
  injectWebSocket?: (server: NodeWebSocketServer) => void
  /** Close any active watchers. */
  close?: () => Promise<void>
}

interface NodeWebSocketServer {
  on: (event: string, listener: (...args: unknown[]) => void) => void
}

/**
 * Create a fetch server that scans routes and serves playground metadata.
 *
 * @param options - Server options input.
 * @returns Fetch server instance.
 *
 * @example
 * import { createFetchServer } from '@mokup/server'
 *
 * const server = await createFetchServer({ entries: { dir: 'mock' } })
 */
export async function createFetchServer(
  options: FetchServerOptionsInput = {},
): Promise<FetchServer> {
  const normalized = normalizeOptions(options)
  const optionList = normalized.entries
  const root = resolveRoot(optionList)
  const logEnabled = optionList.every(entry => entry.log !== false)
  const watchEnabled = optionList.every(entry => entry.watch !== false)
  const logger = createLogger(logEnabled)
  const playgroundConfig = resolvePlaygroundOptions(normalized.playground)
  const dirs = resolveAllDirs(optionList, root)

  const playgroundWs = createPlaygroundWs(playgroundConfig)

  let routes: RouteTable = []
  let disabledRoutes: RouteSkipInfo[] = []
  let ignoredRoutes: RouteIgnoreInfo[] = []
  let configFiles: RouteConfigInfo[] = []
  let disabledConfigFiles: RouteConfigInfo[] = []
  const appParams: Parameters<typeof buildFetchServerApp>[0] = {
    routes,
    disabledRoutes,
    ignoredRoutes,
    configFiles,
    disabledConfigFiles,
    dirs,
    playground: playgroundConfig,
    root,
    logger,
    onResponse: playgroundWs.handleRouteResponse,
  }
  const initialWsHandler = playgroundWs.getWsHandler()
  if (initialWsHandler) {
    appParams.wsHandler = initialWsHandler
  }
  let app = buildFetchServerApp(appParams)

  const refreshRoutes = async (refreshOptions?: { throwOnError?: boolean }) => {
    try {
      const collected: RouteTable = []
      const collectedDisabled: RouteSkipInfo[] = []
      const collectedIgnored: RouteIgnoreInfo[] = []
      const collectedConfigs: RouteConfigInfo[] = []
      const unsupportedRuleFiles = new Set<string>()
      const missingHandlerFiles = new Set<string>()
      const duplicateRoutes = new Set<string>()
      for (const entry of optionList) {
        const diagnosticLogger = {
          ...logger,
          warn: (...args: unknown[]) => {
            if (args.length > 0) {
              const message = args.map(String).join(' ')
              const unsupportedMatch = message.match(unsupportedFieldsWarningRE)
              if (unsupportedMatch?.[1]) {
                unsupportedRuleFiles.add(unsupportedMatch[1])
              }
              const missingHandlerMatch = message.match(missingHandlerWarningRE)
              if (missingHandlerMatch?.[1]) {
                missingHandlerFiles.add(missingHandlerMatch[1])
              }
              const duplicateRouteMatch = message.match(duplicateRouteWarningRE)
              if (duplicateRouteMatch?.[1]) {
                duplicateRoutes.add(duplicateRouteMatch[1])
              }
            }
            logger.warn(...args)
          },
        }
        const scanParams: Parameters<typeof scanRoutes>[0] = {
          dirs: resolveDirs(entry.dir, root),
          prefix: entry.prefix ?? '',
          logger: diagnosticLogger,
          onSkip: info => collectedDisabled.push(info),
          onIgnore: info => collectedIgnored.push(info),
          onConfig: info => collectedConfigs.push(info),
        }
        if (entry.include) {
          scanParams.include = entry.include
        }
        if (entry.exclude) {
          scanParams.exclude = entry.exclude
        }
        if (typeof entry.ignorePrefix !== 'undefined') {
          scanParams.ignorePrefix = entry.ignorePrefix
        }
        const scanned = await scanRoutes(scanParams)
        collected.push(...scanned)
      }
      const errorOn = optionList.find(entry => typeof entry.errorOn !== 'undefined')?.errorOn
      const diagnosticSections = [
        {
          ...routeDiagnosticCatalog.invalidRoute,
          items: collectedIgnored
            .filter(info => info.reason === 'invalid-route')
            .map(info => relative(root, info.file)),
        },
        {
          ...routeDiagnosticCatalog.unsupportedFields,
          items: Array.from(unsupportedRuleFiles).map(file => relative(root, file)),
        },
        {
          ...routeDiagnosticCatalog.missingHandler,
          items: Array.from(missingHandlerFiles).map(file => relative(root, file)),
        },
        {
          ...routeDiagnosticCatalog.duplicateRoute,
          items: Array.from(duplicateRoutes),
        },
      ]
      const diagnosticLines = buildDiagnosticSummaryLines({
        sections: diagnosticSections,
      })
      for (const line of diagnosticLines) {
        logger.warn(line)
      }
      const diagnosticErrorParams: Parameters<typeof createDiagnosticError>[0] = {
        sections: diagnosticSections,
      }
      if (errorOn) {
        diagnosticErrorParams.errorOn = errorOn
      }
      const diagnosticError = createDiagnosticError(diagnosticErrorParams)
      if (diagnosticError) {
        throw diagnosticError
      }
      const resolvedRoutes = sortRoutes(collected)
      routes = resolvedRoutes
      disabledRoutes = collectedDisabled
      ignoredRoutes = collectedIgnored
      const configMap = new Map(collectedConfigs.map(entry => [entry.file, entry]))
      const resolvedConfigs = Array.from(configMap.values())
      configFiles = resolvedConfigs.filter(entry => entry.enabled)
      disabledConfigFiles = resolvedConfigs.filter(entry => !entry.enabled)
      const refreshedParams: Parameters<typeof buildFetchServerApp>[0] = {
        routes,
        disabledRoutes,
        ignoredRoutes,
        configFiles,
        disabledConfigFiles,
        dirs,
        playground: playgroundConfig,
        root,
        logger,
        onResponse: playgroundWs.handleRouteResponse,
      }
      const refreshedWsHandler = playgroundWs.getWsHandler()
      if (refreshedWsHandler) {
        refreshedParams.wsHandler = refreshedWsHandler
      }
      app = buildFetchServerApp(refreshedParams)
      logger.info(`Loaded ${routes.length} mock routes.`)
    }
    catch (error) {
      logger.error('Failed to scan mock routes:', error)
      if (
        refreshOptions?.throwOnError
        && error instanceof Error
        && error.message.startsWith(diagnosticErrorTitle)
      ) {
        throw error
      }
    }
  }

  await refreshRoutes({ throwOnError: true })
  await playgroundWs.setupPlaygroundWebSocket(app)
  const wsHandler = playgroundWs.getWsHandler()
  if (wsHandler && playgroundConfig.enabled) {
    app.get(`${playgroundConfig.path}/ws`, wsHandler)
  }

  const scheduleRefresh = createDebouncer(80, () => {
    void refreshRoutes()
  })
  const watcher = await createWatcher({
    enabled: watchEnabled,
    dirs,
    onChange: scheduleRefresh,
    logger,
  })

  const fetch = async (request: Request) => await app.fetch(request)

  const server: FetchServer = {
    fetch,
    refresh: async () => await refreshRoutes({ throwOnError: true }),
    getRoutes: () => routes,
  }
  const injectWebSocket = playgroundWs.getInjectWebSocket()
  if (injectWebSocket) {
    server.injectWebSocket = injectWebSocket
  }

  if (watcher) {
    server.close = async () => {
      await watcher.close()
    }
  }

  return server
}
