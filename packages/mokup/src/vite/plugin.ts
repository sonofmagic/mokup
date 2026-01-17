import type { FSWatcher } from 'chokidar'
import type { Plugin, PreviewServer, ViteDevServer } from 'vite'
import type { MokupViteOptions, RouteTable } from './types'

import { cwd } from 'node:process'
import chokidar from 'chokidar'
import { createLogger } from './logger'
import { createMiddleware } from './middleware'
import { createPlaygroundMiddleware, resolvePlaygroundOptions } from './playground'
import { scanRoutes } from './scanner'
import { createDebouncer, isInDirs, resolveDirs } from './utils'

function buildRouteSignature(routes: RouteTable) {
  return routes
    .map(route =>
      [
        route.method,
        route.template,
        route.file,
        typeof route.response === 'function' ? 'handler' : 'static',
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

export function createMokupPlugin(options: MokupViteOptions = {}): Plugin {
  let root = cwd()
  let routes: RouteTable = []
  let previewWatcher: FSWatcher | null = null
  let currentServer: ViteDevServer | PreviewServer | null = null
  let lastSignature: string | null = null

  const logger = createLogger(options.log !== false)
  const watchEnabled = options.watch !== false
  const playgroundConfig = resolvePlaygroundOptions(options.playground)
  const playgroundMiddleware = createPlaygroundMiddleware({
    getRoutes: () => routes,
    config: playgroundConfig,
    logger,
    getServer: () => currentServer,
  })

  const refreshRoutes = async (server?: ViteDevServer | PreviewServer) => {
    const dirs = resolveDirs(options.dir, root)
    const scanParams: Parameters<typeof scanRoutes>[0] = {
      dirs,
      prefix: options.prefix ?? '',
      logger,
    }
    if (options.include) {
      scanParams.include = options.include
    }
    if (options.exclude) {
      scanParams.exclude = options.exclude
    }
    if (server) {
      scanParams.server = server
    }
    routes = await scanRoutes(scanParams)
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
      server.middlewares.use(createMiddleware(() => routes, logger))
      if (!watchEnabled) {
        return
      }
      const dirs = resolveDirs(options.dir, root)
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
      server.middlewares.use(createMiddleware(() => routes, logger))
      if (!watchEnabled) {
        return
      }
      const dirs = resolveDirs(options.dir, root)
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
