import type { RouteConfigInfo, RouteIgnoreInfo, RouteSkipInfo } from '@mokup/core'
import type { PreviewServer, ViteDevServer } from 'vite'
import type { DiagnosticErrorMode, RouteTable, VitePluginOptions } from '../../shared/types'
import type { PluginState } from './state'
import { createHonoApp, scanRoutes, sortRoutes } from '@mokup/core'
import { collectRouteDiagnosticWarning, createRouteDiagnosticSections, reportDiagnostics } from '@mokup/shared/diagnostics'
import { relative } from '@mokup/shared/pathe'
import { resolveDirs, toPosix } from '../../shared/utils'
import { buildRouteSignature } from './routes'
import { isViteDevServer } from './server'

function createRouteRefresher(params: {
  state: PluginState
  optionList: VitePluginOptions[]
  root: () => string
  logger: Parameters<typeof scanRoutes>[0]['logger']
  enableViteMiddleware: boolean
  virtualModuleIds?: string[]
  reloadOnChange?: boolean
  errorOn?: DiagnosticErrorMode
}) {
  const {
    state,
    optionList,
    root,
    logger,
    enableViteMiddleware,
    virtualModuleIds,
    reloadOnChange = false,
    errorOn,
  } = params

  return async (
    server?: ViteDevServer | PreviewServer,
    options?: { force?: boolean, silent?: boolean },
  ) => {
    const unsupportedRuleFiles = new Set<string>()
    const missingHandlerFiles = new Set<string>()
    const duplicateRoutes = new Set<string>()
    const diagnosticLogger = {
      ...logger,
      warn: (...args: unknown[]) => {
        if (args.length > 0) {
          collectRouteDiagnosticWarning({
            message: args.map(String).join(' '),
            onUnsupportedFields: value => unsupportedRuleFiles.add(toPosix(relative(root(), value))),
            onMissingHandler: value => missingHandlerFiles.add(toPosix(relative(root(), value))),
            onDuplicateRoute: value => duplicateRoutes.add(value),
          })
        }
        logger.warn(...args)
      },
    }
    const collected: RouteTable = []
    const collectedServer: RouteTable = []
    const collectedSw: RouteTable = []
    const collectedDisabled: RouteSkipInfo[] = []
    const collectedIgnored: RouteIgnoreInfo[] = []
    const collectedConfigs: RouteConfigInfo[] = []
    for (const entry of optionList) {
      const dirs = resolveDirs(entry.dir, root())
      const scanParams: Parameters<typeof scanRoutes>[0] = {
        dirs,
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
      if (server) {
        scanParams.server = server
      }
      const scanned = await scanRoutes(scanParams)
      collected.push(...scanned)
      if (entry.mode === 'sw') {
        collectedSw.push(...scanned)
        if (entry.sw?.fallback !== false) {
          collectedServer.push(...scanned)
        }
      }
      else {
        collectedServer.push(...scanned)
      }
    }
    state.routes = sortRoutes(collected)
    state.serverRoutes = sortRoutes(collectedServer)
    state.swRoutes = sortRoutes(collectedSw)
    state.disabledRoutes = collectedDisabled
    state.ignoredRoutes = collectedIgnored
    const configMap = new Map(collectedConfigs.map(entry => [entry.file, entry]))
    const resolvedConfigs = Array.from(configMap.values())
    state.configFiles = resolvedConfigs.filter(entry => entry.enabled)
    state.disabledConfigFiles = resolvedConfigs.filter(entry => !entry.enabled)
    const diagnosticSections = createRouteDiagnosticSections({
      invalidRoutes: collectedIgnored
        .filter(info => info.reason === 'invalid-route')
        .map(info => toPosix(relative(root(), info.file))),
      unsupportedFields: Array.from(unsupportedRuleFiles),
      missingHandlers: Array.from(missingHandlerFiles),
      duplicateRoutes: Array.from(duplicateRoutes),
    })
    const { error: diagnosticError, summaryLines: diagnosticLines } = reportDiagnostics({
      ...(errorOn ? { errorOn } : {}),
      sections: diagnosticSections,
    })
    const diagnosticSignature = diagnosticLines.join('\n')
    const previousDiagnosticsSignature = state.lastDiagnosticsSignature ?? ''
    const diagnosticsChanged = diagnosticSignature !== previousDiagnosticsSignature
    state.lastDiagnosticsSignature = diagnosticLines.length > 0 ? diagnosticSignature : null
    if (diagnosticError) {
      throw diagnosticError
    }
    if (!options?.silent && diagnosticsChanged) {
      if (diagnosticLines.length > 0) {
        for (const line of diagnosticLines) {
          logger.warn(line)
        }
      }
      else if (previousDiagnosticsSignature) {
        logger.info('Mokup diagnostics cleared.')
      }
    }
    state.app = enableViteMiddleware && state.serverRoutes.length > 0
      ? createHonoApp(state.serverRoutes)
      : null
    const signature = buildRouteSignature(
      state.routes,
      state.disabledRoutes,
      state.ignoredRoutes,
      state.configFiles,
      state.disabledConfigFiles,
    )
    const changed = signature !== state.lastSignature || options?.force
    if (changed && state.swRoutes.length > 0) {
      state.swModuleVersion = (state.swModuleVersion ?? 0) + 1
    }
    if (isViteDevServer(server) && server.ws) {
      const shouldNotify = !options?.silent
        && state.lastSignature
        && changed
      if (shouldNotify) {
        server.ws.send({
          type: 'custom',
          event: 'mokup:routes-changed',
          data: { ts: Date.now() },
        })
        if (virtualModuleIds && virtualModuleIds.length > 0) {
          for (const id of virtualModuleIds) {
            const moduleNode = server.moduleGraph.getModuleById(id)
            if (moduleNode) {
              server.moduleGraph.invalidateModule(moduleNode)
            }
          }
        }
        if (reloadOnChange) {
          server.ws.send({ type: 'full-reload', path: '*' })
        }
      }
    }
    state.lastSignature = signature
  }
}

export { createRouteRefresher }
