import type { Hono } from '@mokup/shared/hono'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, PreviewServer, ViteDevServer } from 'vite'
import type { RouteConfigInfo, RouteIgnoreInfo, RouteSkipInfo } from './scanner'
import type { MokupPluginOptions, RouteTable, VitePluginOptions } from './types'

import { existsSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { cwd } from 'node:process'
import { fileURLToPath } from 'node:url'
import chokidar from '@mokup/shared/chokidar'
import pc from 'picocolors'
import { buildBundleModule } from './bundle'
import { createLogger } from './logger'
import { createHonoApp, createMiddleware } from './middleware'
import { createPlaygroundMiddleware, resolvePlaygroundOptions } from './playground'
import { sortRoutes } from './routes'
import { scanRoutes } from './scanner'
import { buildSwScript, resolveSwConfig, resolveSwUnregisterConfig } from './sw'
import { createDebouncer, isInDirs, resolveDirs } from './utils'

function buildRouteSignature(
  routes: RouteTable,
  disabledRoutes: RouteSkipInfo[],
  ignoredRoutes: RouteIgnoreInfo[],
  configFiles: RouteConfigInfo[],
  disabledConfigFiles: RouteConfigInfo[],
) {
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
    .concat(
      disabledRoutes.map(route =>
        [
          route.reason,
          route.file,
          route.method ?? '',
          route.url ?? '',
        ].join('|'),
      ),
    )
    .concat(
      ignoredRoutes.map(route =>
        [
          route.reason,
          route.file,
        ].join('|'),
      ),
    )
    .concat(
      configFiles.map(route => route.file),
    )
    .concat(
      disabledConfigFiles.map(route => route.file),
    )
    .join('\n')
}

function isViteDevServer(
  server: ViteDevServer | PreviewServer | undefined | null,
): server is ViteDevServer {
  return !!server && 'ws' in server
}

const legacyEntryKeys = [
  'dir',
  'prefix',
  'include',
  'exclude',
  'ignorePrefix',
  'watch',
  'log',
  'mode',
  'sw',
]

function isLegacyEntryOptions(value: Record<string, unknown>) {
  return legacyEntryKeys.some(key => key in value)
}

function normalizeMokupOptions(options: MokupPluginOptions | null | undefined): MokupPluginOptions {
  if (!options) {
    return {}
  }
  if (Array.isArray(options)) {
    throw new TypeError('[mokup] Invalid config: use mokup({ entries: [...] }) instead of mokup([...]).')
  }
  if (typeof options !== 'object') {
    return {}
  }
  if (isLegacyEntryOptions(options as Record<string, unknown>)) {
    throw new Error(
      '[mokup] Invalid config: use mokup({ entries: { ... } }) instead of mokup({ dir, prefix, ... }).',
    )
  }
  return options
}

function normalizeOptions(options: MokupPluginOptions): VitePluginOptions[] {
  const entries = options.entries
  const list = Array.isArray(entries)
    ? entries
    : entries
      ? [entries]
      : [{}]
  return list.length > 0 ? list : [{}]
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

function formatPlaygroundUrl(baseUrl: string | undefined, playgroundPath: string) {
  if (!baseUrl) {
    return playgroundPath
  }
  try {
    return new URL(playgroundPath, baseUrl).href
  }
  catch {
    return playgroundPath
  }
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

function normalizeWatcherFile(file: string, rootDir: string) {
  if (!file) {
    return file
  }
  if (isAbsolute(file)) {
    return file
  }
  return resolve(rootDir, file)
}

function normalizeRawWatcherPath(rawPath: unknown) {
  if (typeof rawPath === 'string') {
    return rawPath
  }
  if (rawPath && typeof (rawPath as { toString?: () => string }).toString === 'function') {
    return (rawPath as { toString: () => string }).toString()
  }
  return ''
}

export function createMokupPlugin(options: MokupPluginOptions = {}): Plugin {
  let root = cwd()
  let base = '/'
  let command: 'serve' | 'build' = 'serve'
  let assetsDir = 'assets'
  let routes: RouteTable = []
  let serverRoutes: RouteTable = []
  let swRoutes: RouteTable = []
  let disabledRoutes: RouteSkipInfo[] = []
  let ignoredRoutes: RouteIgnoreInfo[] = []
  let configFiles: RouteConfigInfo[] = []
  let disabledConfigFiles: RouteConfigInfo[] = []
  let app: Hono | null = null
  type Watcher = ReturnType<typeof chokidar.watch>
  let previewWatcher: Watcher | null = null
  let currentServer: ViteDevServer | PreviewServer | null = null
  let lastSignature: string | null = null

  const normalizedOptions = normalizeMokupOptions(options)
  const runtime = normalizedOptions.runtime ?? 'vite'
  const enableViteMiddleware = runtime !== 'worker'
  const optionList = normalizeOptions(normalizedOptions)
  const logEnabled = optionList.every(entry => entry.log !== false)
  const watchEnabled = optionList.every(entry => entry.watch !== false)
  const playgroundConfig = resolvePlaygroundOptions(normalizedOptions.playground)
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
  const bundleVirtualId = 'virtual:mokup-bundle'
  const resolvedBundleVirtualId = `\0${bundleVirtualId}`
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
    getDisabledRoutes: () => disabledRoutes,
    getIgnoredRoutes: () => ignoredRoutes,
    getConfigFiles: () => configFiles,
    getDisabledConfigFiles: () => disabledConfigFiles,
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
    const collectedDisabled: RouteSkipInfo[] = []
    const collectedIgnored: RouteIgnoreInfo[] = []
    const collectedConfigs: RouteConfigInfo[] = []
    for (const entry of optionList) {
      const dirs = resolveDirs(entry.dir, root)
      const scanParams: Parameters<typeof scanRoutes>[0] = {
        dirs,
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
    disabledRoutes = collectedDisabled
    ignoredRoutes = collectedIgnored
    const configMap = new Map(collectedConfigs.map(entry => [entry.file, entry]))
    const resolvedConfigs = Array.from(configMap.values())
    configFiles = resolvedConfigs.filter(entry => entry.enabled)
    disabledConfigFiles = resolvedConfigs.filter(entry => !entry.enabled)
    app = enableViteMiddleware && serverRoutes.length > 0 ? createHonoApp(serverRoutes) : null
    const signature = buildRouteSignature(
      routes,
      disabledRoutes,
      ignoredRoutes,
      configFiles,
      disabledConfigFiles,
    )
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
      if (id === bundleVirtualId) {
        return resolvedBundleVirtualId
      }
      return null
    },
    async load(id) {
      if (id === resolvedBundleVirtualId) {
        if (!lastSignature) {
          await refreshRoutes(currentServer ?? undefined)
        }
        const dirs = resolveAllDirs()
        for (const dir of dirs) {
          this.addWatchFile(dir)
        }
        for (const route of serverRoutes) {
          this.addWatchFile(route.file)
          route.middlewares?.forEach((entry) => {
            this.addWatchFile(entry.source)
          })
        }
        for (const config of configFiles) {
          this.addWatchFile(config.file)
        }
        for (const config of disabledConfigFiles) {
          this.addWatchFile(config.file)
        }
        return buildBundleModule({ routes: serverRoutes, root })
      }
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
      const script = buildSwLifecycleScript(
        command === 'build' ? undefined : resolveSwImportPath(base),
      )
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
      if (playgroundConfig.enabled) {
        const playgroundPath = resolveRegisterPath(base, playgroundConfig.path)
        const originalPrintUrls = server.printUrls.bind(server)
        const patchPrintUrls = () => {
          const logger = server.config.logger
          const originalInfo = logger.info
          const lines: Array<Parameters<typeof logger.info>> = []
          const captureInfo = ((...args: Parameters<typeof logger.info>) => {
            lines.push(args)
          }) as typeof logger.info
          Object.defineProperty(logger, 'info', {
            configurable: true,
            value: captureInfo,
          })
          try {
            originalPrintUrls()
          }
          finally {
            Object.defineProperty(logger, 'info', {
              configurable: true,
              value: originalInfo,
            })
          }
          const localUrl = server.resolvedUrls?.local?.[0]
          const outputUrl = formatPlaygroundUrl(localUrl, playgroundPath)
          const coloredUrl = pc.magenta(outputUrl)
          const playgroundLine = `  ➜  Mokup Playground: ${coloredUrl}`
          const ansiEscape = '\u001B'
          const ansiPattern = new RegExp(`${ansiEscape}\\[[0-9;]*m`, 'g')
          const stripAnsi = (value: string) => value.replace(ansiPattern, '')
          const findIndex = (needle: string) =>
            lines.findIndex(args => stripAnsi(args[0]).includes(needle))
          const networkIndex = findIndex('  ➜  Network:')
          const localIndex = findIndex('  ➜  Local:')
          const insertIndex = networkIndex >= 0
            ? networkIndex + 1
            : localIndex >= 0
              ? localIndex + 1
              : lines.length
          const outputLines = lines.slice()
          outputLines.splice(insertIndex, 0, [playgroundLine])
          for (const args of outputLines) {
            originalInfo(...args)
          }
        }
        Object.defineProperty(server, 'printUrls', {
          configurable: true,
          value: patchPrintUrls,
        })
      }
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
      if (enableViteMiddleware && serverRoutes.length > 0) {
        server.middlewares.use(createMiddleware(() => app, logger))
      }
      if (!watchEnabled) {
        return
      }
      const dirs = resolveAllDirs()
      server.watcher.add(dirs)
      const scheduleRefresh = createDebouncer(80, () => refreshRoutes(server))
      const handleWatchedFile = (file: string) => {
        const resolvedFile = normalizeWatcherFile(file, server.config.root ?? root)
        if (isInDirs(resolvedFile, dirs)) {
          scheduleRefresh()
        }
      }
      server.watcher.on('add', handleWatchedFile)
      server.watcher.on('change', handleWatchedFile)
      server.watcher.on('unlink', handleWatchedFile)
      server.watcher.on('raw', (eventName, rawPath, details) => {
        if (eventName !== 'rename') {
          return
        }
        const candidate = normalizeRawWatcherPath(rawPath)
        if (!candidate) {
          return
        }
        const baseDir = typeof details === 'object' && details && 'watchedPath' in details
          ? (details as { watchedPath?: string }).watchedPath ?? (server.config.root ?? root)
          : server.config.root ?? root
        const resolvedFile = normalizeWatcherFile(candidate, baseDir)
        if (isInDirs(resolvedFile, dirs)) {
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
      if (enableViteMiddleware && serverRoutes.length > 0) {
        server.middlewares.use(createMiddleware(() => app, logger))
      }
      if (!watchEnabled) {
        return
      }
      const dirs = resolveAllDirs()
      const watcher = chokidar.watch(dirs, { ignoreInitial: true })
      previewWatcher = watcher
      const scheduleRefresh = createDebouncer(80, () => refreshRoutes(server))
      const handleWatchedFile = (file: string) => {
        const resolvedFile = normalizeWatcherFile(file, server.config.root ?? root)
        if (isInDirs(resolvedFile, dirs)) {
          scheduleRefresh()
        }
      }
      watcher.on('add', handleWatchedFile)
      watcher.on('change', handleWatchedFile)
      watcher.on('unlink', handleWatchedFile)
      watcher.on('raw', (eventName, rawPath, details) => {
        if (eventName !== 'rename') {
          return
        }
        const candidate = normalizeRawWatcherPath(rawPath)
        if (!candidate) {
          return
        }
        const baseDir = typeof details === 'object' && details && 'watchedPath' in details
          ? (details as { watchedPath?: string }).watchedPath ?? (server.config.root ?? root)
          : server.config.root ?? root
        const resolvedFile = normalizeWatcherFile(candidate, baseDir)
        if (isInDirs(resolvedFile, dirs)) {
          scheduleRefresh()
        }
      })
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
