import type { Logger, RouteTable } from './dev/types'
import type { MokupFetchServerOptions, MokupFetchServerOptionsInput } from './fetch-options'

import { cwd as nodeCwd } from 'node:process'
import { Hono as HonoApp } from '@mokup/shared/hono'
import { createHonoApp } from './dev/hono'
import { createLogger } from './dev/logger'
import { registerPlaygroundRoutes, resolvePlaygroundOptions } from './dev/playground'
import { sortRoutes } from './dev/routes'
import { scanRoutes } from './dev/scanner'
import { createDebouncer, isInDirs, resolveDirs } from './dev/utils'

export interface MokupFetchServer {
  fetch: (request: Request) => Promise<Response>
  refresh: () => Promise<void>
  getRoutes: () => RouteTable
  close?: () => Promise<void>
}

interface RuntimeDeno {
  cwd?: () => string
  watchFs?: (paths: string | string[], options?: { recursive?: boolean }) => {
    close: () => void
    [Symbol.asyncIterator]: () => AsyncIterator<{ kind: string, paths: string[] }>
  }
}

function normalizeOptions(
  options: MokupFetchServerOptionsInput,
): MokupFetchServerOptions[] {
  const list = Array.isArray(options) ? options : [options]
  return list.length > 0 ? list : [{}]
}

function resolvePlaygroundInput(list: MokupFetchServerOptions[]) {
  for (const entry of list) {
    if (typeof entry.playground !== 'undefined') {
      return entry.playground
    }
  }
  return undefined
}

function resolveFirst<T>(
  list: MokupFetchServerOptions[],
  getter: (entry: MokupFetchServerOptions) => T | undefined,
): T | undefined {
  for (const entry of list) {
    const value = getter(entry)
    if (typeof value !== 'undefined') {
      return value
    }
  }
  return undefined
}

function resolveRoot(list: MokupFetchServerOptions[]) {
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

function resolveAllDirs(list: MokupFetchServerOptions[], root: string) {
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

function buildApp(params: {
  routes: RouteTable
  dirs: string[]
  playground: ReturnType<typeof resolvePlaygroundOptions>
  root: string
  logger: Logger
}) {
  const app = new HonoApp({ strict: false })
  registerPlaygroundRoutes({
    app,
    routes: params.routes,
    dirs: params.dirs,
    logger: params.logger,
    config: params.playground,
    root: params.root,
  })
  if (params.routes.length > 0) {
    const mockApp = createHonoApp(params.routes)
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
  options: MokupFetchServerOptionsInput = {},
): Promise<MokupFetchServer> {
  const optionList = normalizeOptions(options)
  const root = resolveRoot(optionList)
  const logEnabled = optionList.every(entry => entry.log !== false)
  const watchEnabled = optionList.every(entry => entry.watch !== false)
  const logger = createLogger(logEnabled)
  const playgroundConfig = resolvePlaygroundOptions(resolvePlaygroundInput(optionList))
  const dirs = resolveAllDirs(optionList, root)

  let routes: RouteTable = []
  let app = buildApp({
    routes,
    dirs,
    playground: playgroundConfig,
    root,
    logger,
  })

  const refreshRoutes = async () => {
    try {
      const collected: RouteTable = []
      for (const entry of optionList) {
        const scanParams: Parameters<typeof scanRoutes>[0] = {
          dirs: resolveDirs(entry.dir, root),
          prefix: entry.prefix ?? '',
          logger,
        }
        if (entry.include) {
          scanParams.include = entry.include
        }
        if (entry.exclude) {
          scanParams.exclude = entry.exclude
        }
        const scanned = await scanRoutes(scanParams)
        collected.push(...scanned)
      }
      const resolvedRoutes = sortRoutes(collected)
      routes = resolvedRoutes
      app = buildApp({
        routes,
        dirs,
        playground: playgroundConfig,
        root,
        logger,
      })
      logger.info(`Loaded ${routes.length} mock routes.`)
    }
    catch (error) {
      logger.error('Failed to scan mock routes:', error)
    }
  }

  await refreshRoutes()

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

  const server: MokupFetchServer = {
    fetch,
    refresh: refreshRoutes,
    getRoutes: () => routes,
  }

  if (watcher) {
    server.close = async () => {
      await watcher.close()
    }
  }

  return server
}
