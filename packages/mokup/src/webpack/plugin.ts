import type { FSWatcher } from '@mokup/shared/chokidar'
import type { Hono } from '@mokup/shared/hono'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PreviewServer, ViteDevServer } from 'vite'
import type { MokupViteOptions, MokupViteOptionsInput, RouteTable } from '../vite/types'

import { createRequire } from 'node:module'
import { cwd } from 'node:process'
import chokidar from '@mokup/shared/chokidar'
import { build as esbuild } from '@mokup/shared/esbuild'
import { isAbsolute, resolve } from '@mokup/shared/pathe'
import { createLogger } from '../vite/logger'
import { createHonoApp, createMiddleware } from '../vite/middleware'
import { createPlaygroundMiddleware, resolvePlaygroundOptions } from '../vite/playground'
import { sortRoutes } from '../vite/routes'
import { scanRoutes } from '../vite/scanner'
import { buildSwScript, resolveSwConfig, resolveSwUnregisterConfig } from '../vite/sw'
import { createDebouncer, isInDirs, resolveDirs, toPosix } from '../vite/utils'

interface WebpackPluginInstance {
  apply: (compiler: WebpackCompiler) => void
}

interface WebpackDevMiddleware {
  name?: string
  middleware: (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ) => void | Promise<void>
}

interface WebpackDevServer {
  app?: { use: (middleware: WebpackDevMiddleware['middleware']) => void }
}

interface WebpackCompilation {
  hooks: {
    processAssets: {
      tapPromise: (
        options: { name: string, stage: number },
        handler: () => Promise<void>,
      ) => void
    }
  }
  emitAsset: (name: string, source: { source: () => string }) => void
  updateAsset: (name: string, source: { source: () => string }) => void
  getAsset: (name: string) => unknown
  getAssetPath: (name: string, data?: { hash?: string }) => string
  outputOptions: {
    publicPath?: unknown
  }
  hash?: string
}

interface WebpackCompiler {
  context?: string
  options: {
    output?: {
      publicPath?: unknown
      assetModuleFilename?: unknown
    }
    devServer?: {
      setupMiddlewares?: (
        middlewares: WebpackDevMiddleware[],
        devServer: WebpackDevServer,
      ) => WebpackDevMiddleware[]
      devMiddleware?: {
        publicPath?: unknown
      }
    }
  }
  hooks: {
    beforeCompile: { tapPromise: (name: string, handler: () => Promise<void>) => void }
    thisCompilation: { tap: (name: string, handler: (compilation: WebpackCompilation) => void) => void }
    watchRun: { tap: (name: string, handler: (compiler: WebpackCompiler) => void) => void }
    watchClose: { tap: (name: string, handler: () => void) => void }
  }
  watching?: { invalidate: () => void }
  webpack: {
    Compilation: { PROCESS_ASSETS_STAGE_ADDITIONS: number }
    sources: { RawSource: new (source: string) => { source: () => string } }
  }
}

const pluginName = 'mokup:webpack'
const lifecycleBaseName = 'mokup-sw-lifecycle.js'

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

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//.test(value)
}

function resolveBaseFromPublicPath(publicPath: unknown) {
  if (typeof publicPath !== 'string') {
    return '/'
  }
  if (!publicPath || publicPath === 'auto') {
    return '/'
  }
  if (isAbsoluteUrl(publicPath)) {
    return '/'
  }
  return normalizeBase(publicPath)
}

function resolveAssetsDir(assetModuleFilename?: unknown) {
  if (typeof assetModuleFilename !== 'string') {
    return 'assets'
  }
  const normalized = assetModuleFilename.replace(/\\/g, '/')
  const prefix = normalized.split('/')[0] ?? ''
  if (!prefix || prefix.includes('[')) {
    return 'assets'
  }
  return prefix
}

function joinPublicPath(publicPath: string, fileName: string) {
  if (!publicPath) {
    return fileName
  }
  const normalized = publicPath.endsWith('/') ? publicPath : `${publicPath}/`
  return `${normalized}${fileName}`
}

function buildSwLifecycleScript(params: {
  base: string
  importPath: string
  swConfig: ReturnType<typeof resolveSwConfig>
  unregisterConfig: ReturnType<typeof resolveSwUnregisterConfig>
  hasSwEntries: boolean
  hasSwRoutes: boolean
}) {
  const { base, importPath, swConfig, unregisterConfig, hasSwEntries, hasSwRoutes } = params
  const shouldUnregister = unregisterConfig.unregister === true || !hasSwEntries
  if (shouldUnregister) {
    const path = resolveRegisterPath(base, unregisterConfig.path)
    const scope = resolveRegisterScope(base, unregisterConfig.scope)
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
  if (!hasSwRoutes) {
    return null
  }
  const path = resolveRegisterPath(base, swConfig.path)
  const scope = resolveRegisterScope(base, swConfig.scope)
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

function resolveModuleFilePath(file: string, root: string) {
  const absolute = isAbsolute(file) ? file : resolve(root, file)
  const normalized = toPosix(absolute)
  if (/^[a-z]:\//i.test(normalized)) {
    return `file:///${normalized}`
  }
  return normalized
}

async function bundleScript(params: {
  code: string
  root: string
  sourceName: string
}) {
  const result = await esbuild({
    stdin: {
      contents: params.code,
      resolveDir: params.root,
      sourcefile: params.sourceName,
      loader: 'js',
    },
    absWorkingDir: params.root,
    bundle: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2020',
    write: false,
  })
  return result.outputFiles[0]?.text ?? ''
}

const require = createRequire(import.meta.url)

function resolveHtmlWebpackPlugin() {
  try {
    const mod = require('html-webpack-plugin') as {
      default?: unknown
      getHooks?: unknown
    }
    const plugin = (mod.default ?? mod) as {
      getHooks: (compilation: WebpackCompilation) => {
        alterAssetTagGroups?: {
          tap: (name: string, handler: (data: { headTags: unknown[], bodyTags: unknown[], publicPath?: string }) => void) => void
        }
        alterAssetTags?: {
          tap: (name: string, handler: (data: { assetTags: { scripts: unknown[] }, publicPath?: string }) => void) => void
        }
      }
    }
    return plugin
  }
  catch {
    return null
  }
}

export function createMokupWebpackPlugin(
  options: MokupViteOptionsInput = {},
): WebpackPluginInstance {
  const optionList = normalizeOptions(options)
  const logEnabled = optionList.every(entry => entry.log !== false)
  const watchEnabled = optionList.every(entry => entry.watch !== false)
  const playgroundConfig = resolvePlaygroundOptions(resolvePlaygroundInput(optionList))
  const logger = createLogger(logEnabled)
  const hasSwEntries = optionList.some(entry => entry.mode === 'sw')
  const swConfig = resolveSwConfig(optionList, logger)
  const unregisterConfig = resolveSwUnregisterConfig(optionList, logger)

  let root = cwd()
  let base = '/'
  let assetsDir = 'assets'
  let routes: RouteTable = []
  let serverRoutes: RouteTable = []
  let swRoutes: RouteTable = []
  let app: Hono | null = null
  let watcher: FSWatcher | null = null
  let watchingCompiler: WebpackCompiler | null = null
  let swLifecycleBundle: string | null = null
  let swBundle: string | null = null
  let swLifecycleFileName = `${assetsDir}/${lifecycleBaseName}`
  let warnedHtml = false
  let buildPromise: Promise<void> | null = null

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

  const refreshRoutes = async () => {
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
  }

  const rebuildBundles = async () => {
    const lifecycle = buildSwLifecycleScript({
      base,
      importPath: 'mokup/sw',
      swConfig,
      unregisterConfig,
      hasSwEntries,
      hasSwRoutes: hasSwRoutes(),
    })
    swLifecycleBundle = lifecycle
      ? await bundleScript({
          code: lifecycle,
          root,
          sourceName: lifecycleBaseName,
        })
      : null
    if (swConfig && hasSwRoutes()) {
      const swScript = buildSwScript({
        routes: swRoutes,
        root,
        runtimeImportPath: 'mokup/runtime',
        basePaths: swConfig.basePaths ?? [],
        resolveModulePath: resolveModuleFilePath,
      })
      swBundle = await bundleScript({
        code: swScript,
        root,
        sourceName: 'mokup-sw.js',
      })
    }
    else {
      swBundle = null
    }
  }

  const ensureBuilt = async () => {
    if (!buildPromise) {
      buildPromise = (async () => {
        await refreshRoutes()
        await rebuildBundles()
      })()
        .catch((error) => {
          logger.error('Failed to build mokup bundles:', error)
        })
        .finally(() => {
          buildPromise = null
        })
    }
    await buildPromise
  }

  const playgroundMiddleware = createPlaygroundMiddleware({
    getRoutes: () => routes,
    config: playgroundConfig,
    logger,
    getDirs: () => resolveAllDirs(),
    getServer: () => ({ config: { base, root } } as ViteDevServer | PreviewServer),
  })

  const swMiddleware = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ) => {
    if (!swConfig || !hasSwRoutes()) {
      return next()
    }
    const requestUrl = req.url ?? '/'
    const parsed = new URL(requestUrl, 'http://mokup.local')
    const swPath = resolveRegisterPath(base, swConfig.path)
    if (parsed.pathname !== swPath) {
      return next()
    }
    await ensureBuilt()
    if (!swBundle) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Failed to generate mokup service worker.')
      return
    }
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.end(swBundle)
  }

  const mockMiddleware = createMiddleware(() => app, logger)

  return {
    apply(compiler) {
      root = compiler.context ?? cwd()
      assetsDir = resolveAssetsDir(compiler.options.output?.assetModuleFilename)
      swLifecycleFileName = `${assetsDir}/${lifecycleBaseName}`
      base = resolveBaseFromPublicPath(compiler.options.output?.publicPath)

      compiler.hooks.watchRun.tap(pluginName, (active) => {
        watchingCompiler = active
      })

      compiler.hooks.beforeCompile.tapPromise(pluginName, async () => {
        const devPublicPath = compiler.options.devServer?.devMiddleware?.publicPath
        base = resolveBaseFromPublicPath(devPublicPath ?? compiler.options.output?.publicPath)
        await ensureBuilt()
      })

      compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
        const HtmlWebpackPlugin = resolveHtmlWebpackPlugin()
        if (HtmlWebpackPlugin) {
          const hooks = HtmlWebpackPlugin.getHooks(compilation)
          const injectTag = () => {
            if (!swLifecycleBundle) {
              return
            }
            const tagBase = {
              tagName: 'script',
              voidTag: false,
              attributes: {
                type: 'module',
              },
              meta: { plugin: pluginName },
            }
            if ('alterAssetTagGroups' in hooks && hooks.alterAssetTagGroups) {
              hooks.alterAssetTagGroups.tap(pluginName, (data) => {
                const src = joinPublicPath(data.publicPath ?? '', swLifecycleFileName)
                data.headTags.unshift({
                  ...tagBase,
                  attributes: {
                    ...tagBase.attributes,
                    src,
                  },
                })
              })
              return
            }
            if ('alterAssetTags' in hooks && hooks.alterAssetTags) {
              hooks.alterAssetTags.tap(pluginName, (data) => {
                const src = joinPublicPath(data.publicPath ?? '', swLifecycleFileName)
                data.assetTags.scripts.unshift({
                  ...tagBase,
                  attributes: {
                    ...tagBase.attributes,
                    src,
                  },
                })
              })
            }
          }
          injectTag()
        }
        else if (!warnedHtml) {
          warnedHtml = true
          logger.warn('html-webpack-plugin not found; skip SW lifecycle injection.')
        }

        compilation.hooks.processAssets.tapPromise(
          { name: pluginName, stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS },
          async () => {
            await ensureBuilt()
            if (swLifecycleBundle) {
              const RawSource = compiler.webpack.sources.RawSource
              const source = new RawSource(swLifecycleBundle)
              if (compilation.getAsset(swLifecycleFileName)) {
                compilation.updateAsset(swLifecycleFileName, source)
              }
              else {
                compilation.emitAsset(swLifecycleFileName, source)
              }
            }
            if (swBundle && swConfig) {
              const fileName = swConfig.path.startsWith('/')
                ? swConfig.path.slice(1)
                : swConfig.path
              const RawSource = compiler.webpack.sources.RawSource
              const source = new RawSource(swBundle)
              if (compilation.getAsset(fileName)) {
                compilation.updateAsset(fileName, source)
              }
              else {
                compilation.emitAsset(fileName, source)
              }
            }
          },
        )
      })

      const devServer = compiler.options.devServer
      if (devServer) {
        const originalSetup = devServer.setupMiddlewares
        devServer.setupMiddlewares = (middlewares, server) => {
          const devPublicPath = compiler.options.devServer?.devMiddleware?.publicPath
          base = resolveBaseFromPublicPath(devPublicPath ?? compiler.options.output?.publicPath)
          void ensureBuilt()

          const resolved = originalSetup ? originalSetup(middlewares, server) ?? middlewares : middlewares
          resolved.unshift(
            { name: 'mokup-playground', middleware: playgroundMiddleware },
            { name: 'mokup-sw', middleware: swMiddleware },
            { name: 'mokup-mock', middleware: mockMiddleware },
          )

          if (!watcher && watchEnabled) {
            const dirs = resolveAllDirs()
            watcher = chokidar.watch(dirs, { ignoreInitial: true })
            const scheduleRefresh = createDebouncer(80, () => {
              void refreshRoutes()
                .then(rebuildBundles)
                .then(() => {
                  if (watchingCompiler?.watching) {
                    watchingCompiler.watching.invalidate()
                  }
                })
                .catch((error) => {
                  logger.error('Failed to refresh mokup routes:', error)
                })
            })
            watcher.on('add', (file) => {
              if (isInDirs(file, dirs)) {
                scheduleRefresh()
              }
            })
            watcher.on('change', (file) => {
              if (isInDirs(file, dirs)) {
                scheduleRefresh()
              }
            })
            watcher.on('unlink', (file) => {
              if (isInDirs(file, dirs)) {
                scheduleRefresh()
              }
            })
          }

          return resolved
        }
      }

      compiler.hooks.watchClose.tap(pluginName, () => {
        watcher?.close()
        watcher = null
      })
    },
  }
}
