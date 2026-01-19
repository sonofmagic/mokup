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
import { buildSwScript, resolveSwConfig } from './sw'
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

function normalizeBase(base: string) {
  if (!base) {
    return '/'
  }
  if (base.startsWith('.')) {
    return '/'
  }
  let normalized = base.startsWith('/') ? base : `/${base}`
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`
  }
  return normalized
}

function resolveRegisterPath(base: string, path: string) {
  const normalizedBase = normalizeBase(base)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (normalizedPath.startsWith(normalizedBase)) {
    return normalizedPath
  }
  return `${normalizedBase}${normalizedPath.slice(1)}`
}

function resolveRegisterScope(base: string, scope: string) {
  const normalizedBase = normalizeBase(base)
  const normalizedScope = scope.startsWith('/') ? scope : `/${scope}`
  if (normalizedScope.startsWith(normalizedBase)) {
    return normalizedScope
  }
  return `${normalizedBase}${normalizedScope.slice(1)}`
}

export function createMokupPlugin(options: MokupViteOptionsInput = {}): Plugin {
  let root = cwd()
  let base = '/'
  let command: 'serve' | 'build' = 'serve'
  let routes: RouteTable = []
  let serverRoutes: RouteTable = []
  let swRoutes: RouteTable = []
  let app: Hono | null = null
  let previewWatcher: FSWatcher | null = null
  let currentServer: ViteDevServer | PreviewServer | null = null
  let lastSignature: string | null = null

  const optionList = normalizeOptions(options)
  const logEnabled = optionList.every(entry => entry.log !== false)
  const watchEnabled = optionList.every(entry => entry.watch !== false)
  const playgroundConfig = resolvePlaygroundOptions(resolvePlaygroundInput(optionList))
  const logger = createLogger(logEnabled)
  const swConfig = resolveSwConfig(optionList, logger)

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

  const hasSwRoutes = () => !!swConfig && swRoutes.length > 0
  const resolveSwRequestPath = () => {
    if (!swConfig) {
      return null
    }
    return resolveRegisterPath(base, swConfig.path)
  }
  const resolveSwRegisterScope = () => {
    if (!swConfig) {
      return null
    }
    return resolveRegisterScope(base, swConfig.scope)
  }

  const swVirtualId = 'virtual:mokup-sw'
  const resolvedSwVirtualId = `\0${swVirtualId}`

  const buildRegisterScript = () => {
    if (!swConfig) {
      return null
    }
    const path = resolveRegisterPath(base, swConfig.path)
    const scope = resolveSwRegisterScope()
    if (!scope) {
      return null
    }
    return [
      'import { registerMokupServiceWorker } from \'mokup/sw\'',
      '(async () => {',
      `  const registration = await registerMokupServiceWorker({ path: ${JSON.stringify(path)}, scope: ${JSON.stringify(scope)} })`,
      '  if (import.meta.hot && registration) {',
      '    import.meta.hot.on(\'mokup:routes-changed\', () => {',
      '      registration.update()',
      '    })',
      '  }',
      '})()',
    ].join('\n')
  }

  const refreshRoutes = async (server?: ViteDevServer | PreviewServer) => {
    const collected: RouteTable = []
    const collectedServer: RouteTable = []
    const collectedSw: RouteTable = []
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
    routes = sortRoutes(collected)
    serverRoutes = sortRoutes(collectedServer)
    swRoutes = sortRoutes(collectedSw)
    app = serverRoutes.length > 0 ? createHonoApp(serverRoutes) : null
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
    resolveId(id) {
      if (id === swVirtualId) {
        return resolvedSwVirtualId
      }
      return null
    },
    async load(id) {
      if (id !== resolvedSwVirtualId) {
        return null
      }
      if (swRoutes.length === 0) {
        await refreshRoutes()
      }
      return buildSwScript({ routes: swRoutes, root })
    },
    async buildStart() {
      if (!swConfig || command !== 'build') {
        return
      }
      await refreshRoutes()
      if (!hasSwRoutes()) {
        return
      }
      const fileName = swConfig.path.startsWith('/')
        ? swConfig.path.slice(1)
        : swConfig.path
      this.emitFile({
        type: 'chunk',
        id: swVirtualId,
        fileName,
      })
    },
    async transformIndexHtml(html) {
      if (!swConfig || swConfig.register === false) {
        return html
      }
      if (swRoutes.length === 0) {
        await refreshRoutes(currentServer ?? undefined)
      }
      if (!hasSwRoutes()) {
        return html
      }
      const script = buildRegisterScript()
      if (!script) {
        return html
      }
      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: { type: 'module' },
            children: script,
            injectTo: 'head',
          },
        ],
      }
    },
    configResolved(config) {
      root = config.root
      base = config.base ?? '/'
      command = config.command
    },
    async configureServer(server) {
      currentServer = server
      await refreshRoutes(server)
      server.middlewares.use(playgroundMiddleware)
      const swPath = resolveSwRequestPath()
      if (swPath && hasSwRoutes()) {
        server.middlewares.use(async (req, res, next) => {
          const requestUrl = req.url ?? '/'
          const parsed = new URL(requestUrl, 'http://mokup.local')
          if (parsed.pathname !== swPath) {
            return next()
          }
          try {
            const code = buildSwScript({ routes: swRoutes, root })
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
      if (serverRoutes.length > 0) {
        server.middlewares.use(createMiddleware(() => app, logger))
      }
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
      const swPath = resolveSwRequestPath()
      if (swPath && hasSwRoutes()) {
        server.middlewares.use(async (req, res, next) => {
          const requestUrl = req.url ?? '/'
          const parsed = new URL(requestUrl, 'http://mokup.local')
          if (parsed.pathname !== swPath) {
            return next()
          }
          try {
            const code = buildSwScript({ routes: swRoutes, root })
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
      if (serverRoutes.length > 0) {
        server.middlewares.use(createMiddleware(() => app, logger))
      }
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
