import type { Plugin, PreviewServer, ViteDevServer } from 'vite'
import type { MokuViteOptions, RouteTable } from './types'
import { cwd } from 'node:process'

import chokidar from 'chokidar'
import { createLogger } from './logger'
import { createMiddleware } from './middleware'
import { scanRoutes } from './scanner'
import { createDebouncer, isInDirs, resolveDirs } from './utils'

export function createMokuPlugin(options: MokuViteOptions = {}): Plugin {
  let root = cwd()
  let routes: RouteTable = new Map()
  let previewWatcher: chokidar.FSWatcher | null = null

  const logger = createLogger(options.log !== false)
  const watchEnabled = options.watch !== false

  const refreshRoutes = async (server?: ViteDevServer | PreviewServer) => {
    const dirs = resolveDirs(options.dir, root)
    routes = await scanRoutes({
      dirs,
      prefix: options.prefix ?? '',
      include: options.include,
      exclude: options.exclude,
      server,
      logger,
    })
  }

  return {
    name: 'moku:vite',
    enforce: 'pre',
    configResolved(config) {
      root = config.root
    },
    async configureServer(server) {
      await refreshRoutes(server)
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
      await refreshRoutes(server)
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
