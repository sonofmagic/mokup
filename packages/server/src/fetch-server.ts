import type { Server } from 'node:http'
import type { RouteConfigInfo, RouteIgnoreInfo, RouteSkipInfo } from './dev/scanner'
import type { Logger, MiddlewareHandler, ResolvedRoute, RouteTable } from './dev/types'

import type {
  FetchServerOptions,
  FetchServerOptionsConfig,
  FetchServerOptionsInput,
} from './fetch-options'
import { cwd as nodeCwd } from 'node:process'
import { Hono as HonoApp } from '@mokup/shared/hono'
import { createHonoApp } from './dev/hono'
import { createLogger } from './dev/logger'
import { registerPlaygroundRoutes, resolvePlaygroundOptions } from './dev/playground'
import { sortRoutes } from './dev/routes'
import { scanRoutes } from './dev/scanner'
import { createDebouncer, isInDirs, resolveDirs } from './dev/utils'

export type {
  FetchServerOptions,
  FetchServerOptionsConfig,
  FetchServerOptionsInput,
} from './fetch-options'

export interface FetchServer {
  fetch: (request: Request) => Promise<Response>
  refresh: () => Promise<void>
  getRoutes: () => RouteTable
  injectWebSocket?: (server: NodeWebSocketServer) => void
  close?: () => Promise<void>
}

interface RuntimeDeno {
  cwd?: () => string
  watchFs?: (paths: string | string[], options?: { recursive?: boolean }) => {
    close: () => void
    [Symbol.asyncIterator]: () => AsyncIterator<{ kind: string, paths: string[] }>
  }
}

function normalizeEntries(
  entries: FetchServerOptions | FetchServerOptions[] | undefined,
): FetchServerOptions[] {
  const list = Array.isArray(entries)
    ? entries
    : entries
      ? [entries]
      : [{}]
  return list.length > 0 ? list : [{}]
}

function normalizeOptions(
  options: FetchServerOptionsInput,
): { entries: FetchServerOptions[], playground?: FetchServerOptionsConfig['playground'] } {
  return {
    entries: normalizeEntries(options.entries),
    playground: options.playground,
  }
}

function resolveFirst<T>(
  list: FetchServerOptions[],
  getter: (entry: FetchServerOptions) => T | undefined,
): T | undefined {
  for (const entry of list) {
    const value = getter(entry)
    if (typeof value !== 'undefined') {
      return value
    }
  }
  return undefined
}

function resolveRoot(list: FetchServerOptions[]) {
  const explicit = resolveFirst(list, entry => entry.root)
  if (explicit) {
    return explicit
  }
  const deno = (globalThis as { Deno?: RuntimeDeno }).Deno
  if (deno?.cwd) {
    return deno.cwd()
  }
  return nodeCwd()
}

function resolveAllDirs(list: FetchServerOptions[], root: string) {
  const dirs: string[] = []
  const seen = new Set<string>()
  for (const entry of list) {
    for (const dir of resolveDirs(entry.dir, root)) {
      if (seen.has(dir)) {
        continue
      }
      seen.add(dir)
      dirs.push(dir)
    }
  }
  return dirs
}

type RouteCounts = Record<string, number>
interface PlaygroundWsSnapshot {
  type: 'snapshot'
  total: number
  perRoute: RouteCounts
}
interface PlaygroundWsIncrement {
  type: 'increment'
  routeKey: string
  total: number
}
interface NodeWebSocketServer {
  on: (event: string, listener: (...args: unknown[]) => void) => void
}
type HonoInstance = InstanceType<typeof HonoApp>
type PlaygroundWsHandler = MiddlewareHandler<any, string, { outputFormat: 'ws' }>

function buildApp(params: {
  routes: RouteTable
  disabledRoutes: RouteSkipInfo[]
  ignoredRoutes: RouteIgnoreInfo[]
  configFiles: RouteConfigInfo[]
  disabledConfigFiles: RouteConfigInfo[]
  dirs: string[]
  playground: ReturnType<typeof resolvePlaygroundOptions>
  root: string
  logger: Logger
  onResponse?: (route: ResolvedRoute, response: Response) => void | Promise<void>
  wsHandler?: PlaygroundWsHandler
}) {
  const app = new HonoApp({ strict: false })
  registerPlaygroundRoutes({
    app,
    routes: params.routes,
    disabledRoutes: params.disabledRoutes,
    ignoredRoutes: params.ignoredRoutes,
    configFiles: params.configFiles,
    disabledConfigFiles: params.disabledConfigFiles,
    dirs: params.dirs,
    logger: params.logger,
    config: params.playground,
    root: params.root,
  })
  if (params.wsHandler && params.playground.enabled) {
    app.get(`${params.playground.path}/ws`, params.wsHandler)
  }
  if (params.routes.length > 0) {
    const mockAppOptions = params.onResponse ? { onResponse: params.onResponse } : {}
    const mockApp = createHonoApp(params.routes, mockAppOptions)
    app.route('/', mockApp)
  }
  return app
}

async function createDenoWatcher(params: {
  dirs: string[]
  onChange: () => void
  logger: Logger
}): Promise<null | { close: () => Promise<void> }> {
  const deno = (globalThis as { Deno?: RuntimeDeno }).Deno
  if (!deno?.watchFs) {
    return null
  }
  const watcher = deno.watchFs(params.dirs, { recursive: true })
  let closed = false
  ;(async () => {
    try {
      for await (const event of watcher) {
        if (closed) {
          break
        }
        if (event.kind === 'access') {
          continue
        }
        params.onChange()
      }
    }
    catch (error) {
      if (!closed) {
        params.logger.warn('Watcher failed:', error)
      }
    }
  })()

  return {
    close: async () => {
      closed = true
      watcher.close()
    },
  }
}

async function createChokidarWatcher(params: {
  dirs: string[]
  onChange: () => void
}): Promise<null | { close: () => Promise<void> }> {
  try {
    const { default: chokidar } = await import('@mokup/shared/chokidar')
    const watcher = chokidar.watch(params.dirs, { ignoreInitial: true })
    watcher.on('add', (file) => {
      if (isInDirs(file, params.dirs)) {
        params.onChange()
      }
    })
    watcher.on('change', (file) => {
      if (isInDirs(file, params.dirs)) {
        params.onChange()
      }
    })
    watcher.on('unlink', (file) => {
      if (isInDirs(file, params.dirs)) {
        params.onChange()
      }
    })
    return {
      close: async () => {
        await watcher.close()
      },
    }
  }
  catch {
    return null
  }
}

async function createWatcher(params: {
  enabled: boolean
  dirs: string[]
  onChange: () => void
  logger: Logger
}) {
  if (!params.enabled || params.dirs.length === 0) {
    return null
  }
  const denoWatcher = await createDenoWatcher(params)
  if (denoWatcher) {
    return denoWatcher
  }
  const chokidarWatcher = await createChokidarWatcher(params)
  if (chokidarWatcher) {
    return chokidarWatcher
  }
  params.logger.warn('Watcher is not available in this runtime; file watching disabled.')
  return null
}

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

  const routeCounts: RouteCounts = {}
  const wsClients = new Set<{ send: (data: string) => void }>()
  let totalCount = 0
  let wsHandler: PlaygroundWsHandler | undefined
  let injectWebSocket: ((server: NodeWebSocketServer) => void) | undefined

  function getRouteKey(route: ResolvedRoute) {
    return `${route.method} ${route.template}`
  }

  function buildSnapshot(): PlaygroundWsSnapshot {
    return {
      type: 'snapshot',
      total: totalCount,
      perRoute: { ...routeCounts },
    }
  }

  function broadcast(payload: PlaygroundWsSnapshot | PlaygroundWsIncrement) {
    if (wsClients.size === 0) {
      return
    }
    const message = JSON.stringify(payload)
    for (const client of wsClients) {
      try {
        client.send(message)
      }
      catch {
        wsClients.delete(client)
      }
    }
  }

  function registerWsClient(client: { send: (data: string) => void }) {
    wsClients.add(client)
    try {
      client.send(JSON.stringify(buildSnapshot()))
    }
    catch {
      wsClients.delete(client)
    }
  }

  function handleRouteResponse(route: ResolvedRoute) {
    const routeKey = getRouteKey(route)
    routeCounts[routeKey] = (routeCounts[routeKey] ?? 0) + 1
    totalCount += 1
    broadcast({ type: 'increment', routeKey, total: totalCount })
  }

  async function setupPlaygroundWebSocket(app: HonoInstance) {
    if (!playgroundConfig.enabled) {
      return
    }
    try {
      const mod = await import('@hono/node-ws')
      const { createNodeWebSocket } = mod
      const { upgradeWebSocket, injectWebSocket: inject } = createNodeWebSocket({ app })
      wsHandler = upgradeWebSocket(() => ({
        onOpen: (_event, ws) => {
          registerWsClient(ws)
        },
        onClose: (_event, ws) => {
          wsClients.delete(ws)
        },
        onMessage: () => {
          // ignore client messages
        },
      }))
      injectWebSocket = (server) => {
        inject(server as Server)
      }
    }
    catch {
      // ignore websocket setup failures
    }
  }

  let routes: RouteTable = []
  let disabledRoutes: RouteSkipInfo[] = []
  let ignoredRoutes: RouteIgnoreInfo[] = []
  let configFiles: RouteConfigInfo[] = []
  let disabledConfigFiles: RouteConfigInfo[] = []
  let app = buildApp({
    routes,
    disabledRoutes,
    ignoredRoutes,
    configFiles,
    disabledConfigFiles,
    dirs,
    playground: playgroundConfig,
    root,
    logger,
    onResponse: handleRouteResponse,
    ...(wsHandler ? { wsHandler } : {}),
  })

  const refreshRoutes = async () => {
    try {
      const collected: RouteTable = []
      const collectedDisabled: RouteSkipInfo[] = []
      const collectedIgnored: RouteIgnoreInfo[] = []
      const collectedConfigs: RouteConfigInfo[] = []
      for (const entry of optionList) {
        const scanParams: Parameters<typeof scanRoutes>[0] = {
          dirs: resolveDirs(entry.dir, root),
          prefix: entry.prefix ?? '',
          logger,
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
      const resolvedRoutes = sortRoutes(collected)
      routes = resolvedRoutes
      disabledRoutes = collectedDisabled
      ignoredRoutes = collectedIgnored
      const configMap = new Map(collectedConfigs.map(entry => [entry.file, entry]))
      const resolvedConfigs = Array.from(configMap.values())
      configFiles = resolvedConfigs.filter(entry => entry.enabled)
      disabledConfigFiles = resolvedConfigs.filter(entry => !entry.enabled)
      app = buildApp({
        routes,
        disabledRoutes,
        ignoredRoutes,
        configFiles,
        disabledConfigFiles,
        dirs,
        playground: playgroundConfig,
        root,
        logger,
        onResponse: handleRouteResponse,
        ...(wsHandler ? { wsHandler } : {}),
      })
      logger.info(`Loaded ${routes.length} mock routes.`)
    }
    catch (error) {
      logger.error('Failed to scan mock routes:', error)
    }
  }

  await refreshRoutes()
  await setupPlaygroundWebSocket(app)
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
    refresh: refreshRoutes,
    getRoutes: () => routes,
    ...(injectWebSocket ? { injectWebSocket } : {}),
  }

  if (watcher) {
    server.close = async () => {
      await watcher.close()
    }
  }

  return server
}
