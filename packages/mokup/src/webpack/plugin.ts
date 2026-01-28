import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PreviewServer, ViteDevServer } from 'vite'
import type { MokupPluginOptions } from '../shared/types'

import type { BundleState } from './plugin/bundles'
import type { PluginState } from './plugin/state'
import type {
  WebpackCompiler,
  WebpackPluginInstance,
} from './plugin/types'
import { cwd } from 'node:process'
import { createMiddleware } from '../core/middleware'
import { createPlaygroundMiddleware, resolvePlaygroundOptions } from '../core/playground'
import { resolveSwConfig, resolveSwUnregisterConfig } from '../core/sw'
import { createLogger } from '../shared/logger'
import { resolveDirs } from '../shared/utils'
import { createBundleBuilder } from './plugin/bundles'
import { resolveHtmlWebpackPlugin } from './plugin/html'
import { normalizeMokupOptions, normalizeOptions } from './plugin/options'
import {
  joinPublicPath,
  resolveAssetsDir,
  resolveBaseFromPublicPath,
  resolveModuleFilePath,
  resolveRegisterPath,
  resolveRegisterScope,
} from './plugin/paths'
import { createRouteRefresher } from './plugin/refresh'
import { createWebpackWatcher } from './plugin/watcher'

const pluginName = 'mokup:webpack'
const lifecycleBaseName = 'mokup-sw-lifecycle.js'

/**
 * Create the mokup webpack plugin for webpack-dev-server.
 *
 * @param options - Plugin options.
 * @returns Webpack plugin instance.
 *
 * @example
 * import { createWebpackPlugin } from 'mokup/webpack'
 *
 * export default {
 *   plugins: [createWebpackPlugin({ entries: { dir: 'mock' } })],
 * }
 */
export function createMokupWebpackPlugin(
  options: MokupPluginOptions = {},
): WebpackPluginInstance {
  const normalizedOptions = normalizeMokupOptions(options)
  const optionList = normalizeOptions(normalizedOptions)
  const logEnabled = optionList.every(entry => entry.log !== false)
  const watchEnabled = optionList.every(entry => entry.watch !== false)
  const playgroundConfig = resolvePlaygroundOptions(normalizedOptions.playground)
  const logger = createLogger(logEnabled)
  const hasSwEntries = optionList.some(entry => entry.mode === 'sw')
  const swConfig = resolveSwConfig(optionList, logger)
  const unregisterConfig = resolveSwUnregisterConfig(optionList, logger)
  let root = cwd()
  let base = '/'
  let assetsDir = 'assets'
  const state: PluginState = {
    routes: [],
    serverRoutes: [],
    swRoutes: [],
    disabledRoutes: [],
    ignoredRoutes: [],
    configFiles: [],
    disabledConfigFiles: [],
    app: null,
  }
  type Watcher = ReturnType<typeof createWebpackWatcher>
  let watcher: Watcher | null = null
  let watchingCompiler: WebpackCompiler | null = null
  const bundleState: BundleState = {
    swLifecycleBundle: null,
    swBundle: null,
  }
  let swLifecycleFileName = `${assetsDir}/${lifecycleBaseName}`
  let warnedHtml = false
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
  const hasSwRoutes = () => !!swConfig && state.swRoutes.length > 0
  const refreshRoutes = createRouteRefresher({
    state,
    optionList,
    root: () => root,
    logger,
  })
  const { rebuildBundles, ensureBuilt } = createBundleBuilder({
    bundleState,
    state,
    root: () => root,
    swConfig,
    unregisterConfig,
    hasSwEntries,
    hasSwRoutes,
    resolveRequestPath: path => resolveRegisterPath(base, path),
    resolveRegisterScope: scope => resolveRegisterScope(base, scope),
    resolveModulePath: resolveModuleFilePath,
    refreshRoutes,
    logger,
  })

  const playgroundMiddleware = createPlaygroundMiddleware({
    getRoutes: () => state.routes,
    getDisabledRoutes: () => state.disabledRoutes,
    getIgnoredRoutes: () => state.ignoredRoutes,
    getConfigFiles: () => state.configFiles,
    getDisabledConfigFiles: () => state.disabledConfigFiles,
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
    if (!bundleState.swBundle) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Failed to generate mokup service worker.')
      return
    }
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.end(bundleState.swBundle)
  }

  const mockMiddleware = createMiddleware(() => state.app, logger)

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
            if (!bundleState.swLifecycleBundle) {
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
            if (bundleState.swLifecycleBundle) {
              const RawSource = compiler.webpack.sources.RawSource
              const source = new RawSource(bundleState.swLifecycleBundle)
              if (compilation.getAsset(swLifecycleFileName)) {
                compilation.updateAsset(swLifecycleFileName, source)
              }
              else {
                compilation.emitAsset(swLifecycleFileName, source)
              }
            }
            if (bundleState.swBundle && swConfig) {
              const fileName = swConfig.path.startsWith('/')
                ? swConfig.path.slice(1)
                : swConfig.path
              const RawSource = compiler.webpack.sources.RawSource
              const source = new RawSource(bundleState.swBundle)
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
            watcher = createWebpackWatcher({
              enabled: watchEnabled,
              dirs,
              onRefresh: async () => {
                try {
                  await refreshRoutes()
                  await rebuildBundles()
                  if (watchingCompiler?.watching) {
                    watchingCompiler.watching.invalidate()
                  }
                }
                catch (error) {
                  logger.error('Failed to refresh mokup routes:', error)
                }
              },
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
