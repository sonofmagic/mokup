import type { Plugin, PreviewServer, ViteDevServer } from 'vite'
import type { MokupPluginOptions } from '../shared/types'

import type { PluginState } from './plugin/state'
import { cwd } from 'node:process'
import { buildBundleModule } from '../core/bundle'
import { createPlaygroundMiddleware, resolvePlaygroundOptions } from '../core/playground'
import { buildSwScript, resolveSwConfig, resolveSwUnregisterConfig } from '../core/sw'
import { createLogger } from '../shared/logger'
import { normalizeMokupOptions, normalizeOptions } from './plugin/options'
import { resolveSwImportPath } from './plugin/paths'
import { createRouteRefresher } from './plugin/refresh'
import { createDirResolver, createHtmlAssetResolver, createSwPathResolver } from './plugin/resolvers'
import { configureDevServer, configurePreviewServer } from './plugin/server-hooks'
import { buildSwLifecycleScript, resolveSwModuleImport } from './plugin/sw'

/**
 * Create the mokup Vite plugin.
 *
 * @param options - Plugin options.
 * @returns Vite plugin instance.
 *
 * @example
 * import mokup from 'mokup/vite'
 *
 * export default {
 *   plugins: [
 *     mokup({
 *       entries: { dir: 'mock', prefix: '/api' },
 *       playground: true,
 *     }),
 *   ],
 * }
 */
export function createMokupPlugin(options: MokupPluginOptions = {}): Plugin {
  let root = cwd()
  let base = '/'
  let command: 'serve' | 'build' = 'serve'
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
    lastSignature: null,
  }
  type PreviewWatcher = Awaited<ReturnType<typeof configurePreviewServer>>
  let previewWatcher: PreviewWatcher | null = null
  let currentServer: ViteDevServer | PreviewServer | null = null

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

  const resolveAllDirs = createDirResolver(optionList, () => root)
  const hasSwRoutes = () => !!swConfig && state.swRoutes.length > 0
  const { resolveSwRequestPath, resolveSwRegisterScope } = createSwPathResolver(() => base)
  const { resolveHtmlAssetPath, resolveAssetsFileName } = createHtmlAssetResolver(
    () => base,
    () => assetsDir,
  )

  const swVirtualId = 'virtual:mokup-sw'
  const resolvedSwVirtualId = `\0${swVirtualId}`
  const swLifecycleVirtualId = 'virtual:mokup-sw-lifecycle'
  const resolvedSwLifecycleVirtualId = `\0${swLifecycleVirtualId}`
  const bundleVirtualId = 'virtual:mokup-bundle'
  const resolvedBundleVirtualId = `\0${bundleVirtualId}`
  let swLifecycleFileName: string | null = null
  let swLifecycleScript: string | null = null

  const playgroundMiddleware = createPlaygroundMiddleware({
    getRoutes: () => state.routes,
    getDisabledRoutes: () => state.disabledRoutes,
    getIgnoredRoutes: () => state.ignoredRoutes,
    getConfigFiles: () => state.configFiles,
    getDisabledConfigFiles: () => state.disabledConfigFiles,
    config: playgroundConfig,
    logger,
    getServer: () => currentServer,
    getDirs: () => resolveAllDirs(),
    getSwScript: () => buildSwLifecycleScript({
      importPath: resolveSwImportPath(base),
      swConfig,
      unregisterConfig,
      hasSwEntries,
      hasSwRoutes: hasSwRoutes(),
      resolveRequestPath: resolveSwRequestPath,
      resolveRegisterScope: resolveSwRegisterScope,
    }),
  })

  const refreshRoutes = createRouteRefresher({
    state,
    optionList,
    root: () => root,
    logger,
    enableViteMiddleware,
  })

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
        if (!state.lastSignature) {
          await refreshRoutes(currentServer ?? undefined)
        }
        const dirs = resolveAllDirs()
        for (const dir of dirs) {
          this.addWatchFile(dir)
        }
        for (const route of state.serverRoutes) {
          this.addWatchFile(route.file)
          route.middlewares?.forEach((entry) => {
            this.addWatchFile(entry.source)
          })
        }
        for (const config of state.configFiles) {
          this.addWatchFile(config.file)
        }
        for (const config of state.disabledConfigFiles) {
          this.addWatchFile(config.file)
        }
        return buildBundleModule({ routes: state.serverRoutes, root })
      }
      if (id !== resolvedSwVirtualId) {
        if (id !== resolvedSwLifecycleVirtualId) {
          return null
        }
        if (!swLifecycleScript) {
          if (state.swRoutes.length === 0) {
            await refreshRoutes()
          }
          const importPath = await resolveSwModuleImport(this)
          swLifecycleScript = buildSwLifecycleScript({
            importPath,
            swConfig,
            unregisterConfig,
            hasSwEntries,
            hasSwRoutes: hasSwRoutes(),
            resolveRequestPath: resolveSwRequestPath,
            resolveRegisterScope: resolveSwRegisterScope,
          })
        }
        return swLifecycleScript ?? ''
      }
      if (state.swRoutes.length === 0) {
        await refreshRoutes()
      }
      return buildSwScript({
        routes: state.swRoutes,
        root,
        basePaths: swConfig?.basePaths ?? [],
      })
    },
    async buildStart() {
      if (command !== 'build') {
        return
      }
      await refreshRoutes()
      const shouldInject = buildSwLifecycleScript({
        importPath: 'mokup/sw',
        swConfig,
        unregisterConfig,
        hasSwEntries,
        hasSwRoutes: hasSwRoutes(),
        resolveRequestPath: resolveSwRequestPath,
        resolveRegisterScope: resolveSwRegisterScope,
      }) !== null
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
      if (state.swRoutes.length === 0) {
        await refreshRoutes(currentServer ?? undefined)
      }
      const script = buildSwLifecycleScript({
        importPath: command === 'build' ? 'mokup/sw' : resolveSwImportPath(base),
        swConfig,
        unregisterConfig,
        hasSwEntries,
        hasSwRoutes: hasSwRoutes(),
        resolveRequestPath: resolveSwRequestPath,
        resolveRegisterScope: resolveSwRegisterScope,
      })
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
      await configureDevServer({
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
      })
    },
    async configurePreviewServer(server) {
      currentServer = server
      previewWatcher = await configurePreviewServer({
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
      })
      server.httpServer?.once('close', () => {
        previewWatcher = null
      })
    },
    closeBundle() {
      previewWatcher?.close()
      previewWatcher = null
    },
  }
}
