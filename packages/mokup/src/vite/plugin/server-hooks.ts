import type { PreviewServer, ViteDevServer } from 'vite'
import type { PlaygroundConfig } from '../../core/playground/config'
import type { resolveSwConfig } from '../../core/sw'
import type { Logger } from '../../shared/types'
import type { MiddlewareHandler } from './middleware'
import type { PluginState } from './state'
import { createMiddleware } from '../../core/middleware'
import { buildSwScript } from '../../core/sw'
import { addMiddlewareFirst } from './middleware'
import {
  resolveRegisterPath,
  resolveSwRuntimeImportPath,
} from './paths'
import { patchPlaygroundPrintUrls } from './playground'
import { setupPreviewWatchers, setupViteWatchers } from './watcher'

async function configureDevServer(params: {
  server: ViteDevServer
  state: PluginState
  root: string
  base: string
  logger: Logger
  playgroundConfig: PlaygroundConfig
  playgroundMiddleware: MiddlewareHandler
  swConfig: ReturnType<typeof resolveSwConfig>
  hasSwRoutes: () => boolean
  enableViteMiddleware: boolean
  refreshRoutes: (server?: ViteDevServer | PreviewServer) => Promise<void>
  resolveAllDirs: () => string[]
  watchEnabled: boolean
}) {
  const {
    server,
    state,
    root,
    base,
    logger,
    playgroundConfig,
    playgroundMiddleware,
    swConfig,
    hasSwRoutes,
    enableViteMiddleware,
    refreshRoutes,
    resolveAllDirs,
    watchEnabled,
  } = params

  await refreshRoutes(server)
  addMiddlewareFirst(server, playgroundMiddleware)
  if (playgroundConfig.enabled) {
    const playgroundPath = resolveRegisterPath(base, playgroundConfig.path)
    patchPlaygroundPrintUrls(server, playgroundPath)
  }
  const swPath = swConfig ? resolveRegisterPath(base, swConfig.path) : null
  if (swPath && hasSwRoutes()) {
    server.middlewares.use(async (req, res, next) => {
      const requestUrl = req.url ?? '/'
      const parsed = new URL(requestUrl, 'http://mokup.local')
      if (parsed.pathname !== swPath) {
        return next()
      }
      try {
        const code = buildSwScript({
          routes: state.swRoutes,
          root,
          runtimeImportPath: resolveSwRuntimeImportPath(base),
          basePaths: swConfig?.basePaths ?? [],
        })
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(code)
      }
      catch (error) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end('Failed to generate mokup service worker.')
        logger.error('SW generation failed:', error)
      }
    })
  }
  if (enableViteMiddleware && state.serverRoutes.length > 0) {
    server.middlewares.use(createMiddleware(() => state.app, logger))
  }
  if (!watchEnabled) {
    return
  }
  const dirs = resolveAllDirs()
  setupViteWatchers({
    server,
    root,
    dirs,
    refresh: () => refreshRoutes(server),
  })
}

async function configurePreviewServer(params: {
  server: PreviewServer
  state: PluginState
  root: string
  base: string
  logger: Logger
  playgroundConfig: PlaygroundConfig
  playgroundMiddleware: MiddlewareHandler
  swConfig: ReturnType<typeof resolveSwConfig>
  hasSwRoutes: () => boolean
  enableViteMiddleware: boolean
  refreshRoutes: (server?: ViteDevServer | PreviewServer) => Promise<void>
  resolveAllDirs: () => string[]
  watchEnabled: boolean
}) {
  const {
    server,
    state,
    root,
    base,
    logger,
    playgroundMiddleware,
    swConfig,
    hasSwRoutes,
    enableViteMiddleware,
    refreshRoutes,
    resolveAllDirs,
    watchEnabled,
  } = params

  await refreshRoutes(server)
  addMiddlewareFirst(server, playgroundMiddleware)
  const swPath = swConfig ? resolveRegisterPath(base, swConfig.path) : null
  if (swPath && hasSwRoutes()) {
    server.middlewares.use(async (req, res, next) => {
      const requestUrl = req.url ?? '/'
      const parsed = new URL(requestUrl, 'http://mokup.local')
      if (parsed.pathname !== swPath) {
        return next()
      }
      try {
        const code = buildSwScript({
          routes: state.swRoutes,
          root,
          basePaths: swConfig?.basePaths ?? [],
        })
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(code)
      }
      catch (error) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end('Failed to generate mokup service worker.')
        logger.error('SW generation failed:', error)
      }
    })
  }
  if (enableViteMiddleware && state.serverRoutes.length > 0) {
    server.middlewares.use(createMiddleware(() => state.app, logger))
  }
  if (!watchEnabled) {
    return null
  }
  const dirs = resolveAllDirs()
  const watcher = setupPreviewWatchers({
    server,
    root,
    dirs,
    refresh: () => refreshRoutes(server),
  })
  return watcher
}

export { configureDevServer, configurePreviewServer }
