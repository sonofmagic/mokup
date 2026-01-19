import type { FSWatcher } from 'chokidar'
import type { Hono } from 'hono'
import type { Plugin, PreviewServer, ViteDevServer } from 'vite'
import type { MokupViteOptions, MokupViteOptionsInput, RouteTable } from './types'

import { cwd } from 'node:process'
import chokidar from 'chokidar'
import { createLogger } from './logger'
import { createHonoApp, createMiddleware } from './middleware'
import { createPlaygroundMiddleware, resolvePlaygroundOptions } from './playground'
import { sortRoutes } from './routes'
import { scanRoutes } from './scanner'
import { createDebouncer, isInDirs, resolveDirs } from './utils'

function buildRouteSignature(routes: RouteTable) {
  return routes
    .map(route =>
      [
        route.method,
        route.template,
        route.file,
        typeof route.handler === 'function' ? 'handler' : 'static',
        route.status ?? '',
        route.delay ?? '',
      ].join('|'),
    )
    .join('\n')
}

function isViteDevServer(
  server: ViteDevServer | PreviewServer | undefined | null,
): server is ViteDevServer {
  return !!server && 'ws' in server
}

function normalizeOptions(options: MokupViteOptionsInput): MokupViteOptions[] {
  const list = Array.isArray(options) ? options : [options]
  return list.length > 0 ? list : [{}]
}

function resolvePlaygroundInput(list: MokupViteOptions[]) {
  for (const entry of list) {
    if (typeof entry.playground !== 'undefined') {
      return entry.playground
    }
  }
  return undefined
}

export function createMokupPlugin(options: MokupViteOptionsInput = {}): Plugin {
  let root = cwd()
  let routes: RouteTable = []
  let app: Hono | null = null
  let previewWatcher: FSWatcher | null = null
  let currentServer: ViteDevServer | PreviewServer | null = null
  let lastSignature: string | null = null

  const optionList = normalizeOptions(options)
  const logEnabled = optionList.every(entry => entry.log !== false)
  const watchEnabled = optionList.every(entry => entry.watch !== false)
  const playgroundConfig = resolvePlaygroundOptions(resolvePlaygroundInput(optionList))
  const logger = createLogger(logEnabled)

  const resolveAllDirs = () => {
    const dirs: string[] = []
    const seen = new Set<string>()
    for (const entry of optionList) {
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

  const playgroundMiddleware = createPlaygroundMiddleware({
    getRoutes: () => routes,
    config: playgroundConfig,
    logger,
    getServer: () => currentServer,
    getDirs: () => resolveAllDirs(),
  })

  const refreshRoutes = async (server?: ViteDevServer | PreviewServer) => {
    const collected: RouteTable = []
    for (const entry of optionList) {
      const dirs = resolveDirs(entry.dir, root)
      const scanParams: Parameters<typeof scanRoutes>[0] = {
        dirs,
        prefix: entry.prefix ?? '',
        logger,
      }
      if (entry.include) {
        scanParams.include = entry.include
      }
      if (entry.exclude) {
        scanParams.exclude = entry.exclude
      }
      if (server) {
        scanParams.server = server
      }
      const scanned = await scanRoutes(scanParams)
      collected.push(...scanned)
    }
    routes = sortRoutes(collected)
    app = createHonoApp(routes)
    const signature = buildRouteSignature(routes)
    if (isViteDevServer(server) && server.ws) {
      if (lastSignature && signature !== lastSignature) {
        server.ws.send({
          type: 'custom',
          event: 'mokup:routes-changed',
          data: { ts: Date.now() },
        })
      }
    }
    lastSignature = signature
  }

  return {
    name: 'mokup:vite',
    enforce: 'pre',
    configResolved(config) {
      root = config.root
    },
    async configureServer(server) {
      currentServer = server
      await refreshRoutes(server)
      server.middlewares.use(playgroundMiddleware)
      server.middlewares.use(createMiddleware(() => app, logger))
      if (!watchEnabled) {
        return
      }
      const dirs = resolveAllDirs()
      server.watcher.add(dirs)
      const scheduleRefresh = createDebouncer(80, () => refreshRoutes(server))
      server.watcher.on('add', (file) => {
        if (isInDirs(file, dirs)) {
          scheduleRefresh()
        }
      })
      server.watcher.on('change', (file) => {
        if (isInDirs(file, dirs)) {
          scheduleRefresh()
        }
      })
      server.watcher.on('unlink', (file) => {
        if (isInDirs(file, dirs)) {
          scheduleRefresh()
        }
      })
    },
    async configurePreviewServer(server) {
      currentServer = server
      await refreshRoutes(server)
      server.middlewares.use(playgroundMiddleware)
      server.middlewares.use(createMiddleware(() => app, logger))
      if (!watchEnabled) {
        return
      }
      const dirs = resolveAllDirs()
      previewWatcher = chokidar.watch(dirs, { ignoreInitial: true })
      const scheduleRefresh = createDebouncer(80, () => refreshRoutes(server))
      previewWatcher.on('add', scheduleRefresh)
      previewWatcher.on('change', scheduleRefresh)
      previewWatcher.on('unlink', scheduleRefresh)
      server.httpServer?.once('close', () => {
        previewWatcher?.close()
        previewWatcher = null
      })
    },
    closeBundle() {
      previewWatcher?.close()
      previewWatcher = null
    },
  }
}
