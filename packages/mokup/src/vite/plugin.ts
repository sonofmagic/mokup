import type { Hono } from '@mokup/shared/hono'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, PreviewServer, ViteDevServer } from 'vite'
import type { MokupViteOptions, MokupViteOptionsInput, RouteTable } from './types'

import { existsSync } from 'node:fs'
import { cwd } from 'node:process'
import { fileURLToPath } from 'node:url'
import chokidar from '@mokup/shared/chokidar'
import { createLogger } from './logger'
import { createHonoApp, createMiddleware } from './middleware'
import { createPlaygroundMiddleware, resolvePlaygroundOptions } from './playground'
import { sortRoutes } from './routes'
import { scanRoutes } from './scanner'
import { buildSwScript, resolveSwConfig, resolveSwUnregisterConfig } from './sw'
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

function resolveSwImportPath(base: string) {
  const normalizedBase = normalizeBase(base)
  return `${normalizedBase}@id/mokup/sw`
}

function resolveSwRuntimeImportPath(base: string) {
  const normalizedBase = normalizeBase(base)
  return `${normalizedBase}@id/mokup/runtime`
}

const swModuleCandidates = [
  new URL('../sw.ts', import.meta.url),
  new URL('../sw.js', import.meta.url),
]
const localSwModulePath = (() => {
  for (const candidate of swModuleCandidates) {
    const filePath = fileURLToPath(candidate)
    if (existsSync(filePath)) {
      return filePath
    }
  }
  return fileURLToPath(swModuleCandidates[0] ?? new URL('../sw.ts', import.meta.url))
})()

type MiddlewareHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => void

interface ResolveContext {
  resolve: (id: string) => Promise<{ id: string } | null>
}

interface MiddlewareStackEntry {
  route: string
  handle: MiddlewareHandler
}

interface MiddlewareWithStack {
  stack: MiddlewareStackEntry[]
}

function hasMiddlewareStack(
  middlewares: ViteDevServer['middlewares'] | PreviewServer['middlewares'],
): middlewares is ViteDevServer['middlewares'] & MiddlewareWithStack {
  const candidate = middlewares as { stack?: unknown }
  return Array.isArray(candidate.stack)
}

function addMiddlewareFirst(
  server: ViteDevServer | PreviewServer,
  middleware: MiddlewareHandler,
) {
  if (hasMiddlewareStack(server.middlewares)) {
    server.middlewares.stack.unshift({ route: '', handle: middleware })
    return
  }
  server.middlewares.use(middleware)
}

export function createMokupPlugin(options: MokupViteOptionsInput = {}): Plugin {
  let root = cwd()
  let base = '/'
  let command: 'serve' | 'build' = 'serve'
  let assetsDir = 'assets'
  let routes: RouteTable = []
  let serverRoutes: RouteTable = []
  let swRoutes: RouteTable = []
  let app: Hono | null = null
  type Watcher = ReturnType<typeof chokidar.watch>
  let previewWatcher: Watcher | null = null
  let currentServer: ViteDevServer | PreviewServer | null = null
  let lastSignature: string | null = null

  const optionList = normalizeOptions(options)
  const logEnabled = optionList.every(entry => entry.log !== false)
  const watchEnabled = optionList.every(entry => entry.watch !== false)
  const playgroundConfig = resolvePlaygroundOptions(resolvePlaygroundInput(optionList))
  const logger = createLogger(logEnabled)
  const hasSwEntries = optionList.some(entry => entry.mode === 'sw')
  const swConfig = resolveSwConfig(optionList, logger)
  const unregisterConfig = resolveSwUnregisterConfig(optionList, logger)

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

  const hasSwRoutes = () => !!swConfig && swRoutes.length > 0
  const resolveSwRequestPath = (path: string) => resolveRegisterPath(base, path)
  const resolveSwRegisterScope = (scope: string) => resolveRegisterScope(base, scope)
  const resolveHtmlAssetPath = (fileName: string) => {
    const normalizedFileName = fileName.startsWith('/')
      ? fileName.slice(1)
      : fileName
    if (base && base.startsWith('.')) {
      return normalizedFileName
    }
    const normalizedBase = normalizeBase(base)
    return `${normalizedBase}${normalizedFileName}`
  }
  const resolveAssetsFileName = (fileName: string) => {
    const trimmed = assetsDir.replace(/^\/+|\/+$/g, '')
    if (!trimmed) {
      return fileName
    }
    return `${trimmed}/${fileName}`
  }

  const swVirtualId = 'virtual:mokup-sw'
  const resolvedSwVirtualId = `\0${swVirtualId}`
  const swLifecycleVirtualId = 'virtual:mokup-sw-lifecycle'
  const resolvedSwLifecycleVirtualId = `\0${swLifecycleVirtualId}`
  let swLifecycleFileName: string | null = null
  let swLifecycleScript: string | null = null

  async function resolveSwModuleImport(context: ResolveContext) {
    const resolved = await context.resolve('mokup/sw')
    if (resolved?.id) {
      return resolved.id
    }
    const fallbackResolved = await context.resolve(localSwModulePath)
    if (fallbackResolved?.id) {
      return fallbackResolved.id
    }
    return localSwModulePath
  }

  function buildSwLifecycleScript(importPath = 'mokup/sw') {
    const shouldUnregister = unregisterConfig.unregister === true || !hasSwEntries
    if (shouldUnregister) {
      const path = resolveSwRequestPath(unregisterConfig.path)
      const scope = resolveSwRegisterScope(unregisterConfig.scope)
      return [
        `import { unregisterMokupServiceWorker } from ${JSON.stringify(importPath)}`,
        '(async () => {',
        `  await unregisterMokupServiceWorker({ path: ${JSON.stringify(path)}, scope: ${JSON.stringify(scope)} })`,
        '})()',
      ].join('\n')
    }
    if (!swConfig || swConfig.register === false) {
      return null
    }
    if (!hasSwRoutes()) {
      return null
    }
    const path = resolveSwRequestPath(swConfig.path)
    const scope = resolveSwRegisterScope(swConfig.scope)
    return [
      `import { registerMokupServiceWorker } from ${JSON.stringify(importPath)}`,
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

  const playgroundMiddleware = createPlaygroundMiddleware({
    getRoutes: () => routes,
    config: playgroundConfig,
    logger,
    getServer: () => currentServer,
    getDirs: () => resolveAllDirs(),
    getSwScript: () => buildSwLifecycleScript(resolveSwImportPath(base)),
  })

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
      if (id === swLifecycleVirtualId) {
        return resolvedSwLifecycleVirtualId
      }
      return null
    },
    async load(id) {
      if (id !== resolvedSwVirtualId) {
        if (id !== resolvedSwLifecycleVirtualId) {
          return null
        }
        if (!swLifecycleScript) {
          if (swRoutes.length === 0) {
            await refreshRoutes()
          }
          const importPath = await resolveSwModuleImport(this)
          swLifecycleScript = buildSwLifecycleScript(importPath)
        }
        return swLifecycleScript ?? ''
      }
      if (swRoutes.length === 0) {
        await refreshRoutes()
      }
      return buildSwScript({
        routes: swRoutes,
        root,
        basePaths: swConfig?.basePaths ?? [],
      })
    },
    async buildStart() {
      if (command !== 'build') {
        return
      }
      await refreshRoutes()
      const shouldInject = buildSwLifecycleScript() !== null
      swLifecycleScript = null
      if (shouldInject) {
        swLifecycleFileName = resolveAssetsFileName('mokup-sw-lifecycle.js')
        this.emitFile({
          type: 'chunk',
          id: swLifecycleVirtualId,
          fileName: swLifecycleFileName,
        })
      }
      else {
        swLifecycleFileName = null
      }
      if (!swConfig || !hasSwRoutes()) {
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
      if (swRoutes.length === 0) {
        await refreshRoutes(currentServer ?? undefined)
      }
      const script = buildSwLifecycleScript()
      if (!script) {
        return html
      }
      if (command === 'build') {
        if (!swLifecycleFileName) {
          return html
        }
        const src = resolveHtmlAssetPath(swLifecycleFileName)
        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: { type: 'module', src },
              injectTo: 'head',
            },
          ],
        }
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
      assetsDir = config.build.assetsDir ?? 'assets'
    },
    async configureServer(server) {
      currentServer = server
      await refreshRoutes(server)
      addMiddlewareFirst(server, playgroundMiddleware)
      const swPath = swConfig ? resolveSwRequestPath(swConfig.path) : null
      if (swPath && hasSwRoutes()) {
        server.middlewares.use(async (req, res, next) => {
          const requestUrl = req.url ?? '/'
          const parsed = new URL(requestUrl, 'http://mokup.local')
          if (parsed.pathname !== swPath) {
            return next()
          }
          try {
            const code = buildSwScript({
              routes: swRoutes,
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
      addMiddlewareFirst(server, playgroundMiddleware)
      const swPath = swConfig ? resolveSwRequestPath(swConfig.path) : null
      if (swPath && hasSwRoutes()) {
        server.middlewares.use(async (req, res, next) => {
          const requestUrl = req.url ?? '/'
          const parsed = new URL(requestUrl, 'http://mokup.local')
          if (parsed.pathname !== swPath) {
            return next()
          }
          try {
            const code = buildSwScript({
              routes: swRoutes,
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
      if (serverRoutes.length > 0) {
        server.middlewares.use(createMiddleware(() => app, logger))
      }
      if (!watchEnabled) {
        return
      }
      const dirs = resolveAllDirs()
      const watcher = chokidar.watch(dirs, { ignoreInitial: true })
      previewWatcher = watcher
      const scheduleRefresh = createDebouncer(80, () => refreshRoutes(server))
      watcher.on('add', scheduleRefresh)
      watcher.on('change', scheduleRefresh)
      watcher.on('unlink', scheduleRefresh)
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
