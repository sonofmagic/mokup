import type { resolveSwConfig, resolveSwUnregisterConfig } from '@mokup/core'
import type { Logger } from '../../shared/types'
import type { PluginState } from './state'
import { buildSwScript } from '@mokup/core'
import { bundleScript } from './bundle'
import { buildSwLifecycleScript } from './sw'

interface BundleState {
  swLifecycleBundle: string | null
  swBundle: string | null
}

function createBundleBuilder(params: {
  bundleState: BundleState
  state: PluginState
  root: () => string
  swConfig: ReturnType<typeof resolveSwConfig>
  unregisterConfig: ReturnType<typeof resolveSwUnregisterConfig>
  hasSwEntries: boolean
  hasSwRoutes: () => boolean
  resolveRequestPath: (path: string) => string
  resolveRegisterScope: (scope: string) => string
  resolveModulePath: (file: string, root: string) => string
  refreshRoutes: () => Promise<void>
  logger: Logger
}) {
  const {
    bundleState,
    state,
    root,
    swConfig,
    unregisterConfig,
    hasSwEntries,
    hasSwRoutes,
    resolveRequestPath,
    resolveRegisterScope,
    resolveModulePath,
    refreshRoutes,
    logger,
  } = params

  let buildPromise: Promise<void> | null = null

  const rebuildBundles = async () => {
    const lifecycle = buildSwLifecycleScript({
      importPath: 'mokup/sw',
      swConfig,
      unregisterConfig,
      hasSwEntries,
      hasSwRoutes: hasSwRoutes(),
      resolveRequestPath,
      resolveRegisterScope,
    })
    bundleState.swLifecycleBundle = lifecycle
      ? await bundleScript({
          code: lifecycle,
          root: root(),
          sourceName: 'mokup-sw-lifecycle.js',
        })
      : null
    if (swConfig && hasSwRoutes()) {
      const swScript = buildSwScript({
        routes: state.swRoutes,
        root: root(),
        runtimeImportPath: 'mokup/runtime',
        basePaths: swConfig.basePaths ?? [],
        resolveModulePath,
      })
      bundleState.swBundle = await bundleScript({
        code: swScript,
        root: root(),
        sourceName: 'mokup-sw.js',
      })
    }
    else {
      bundleState.swBundle = null
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

  return { rebuildBundles, ensureBuilt }
}

export type { BundleState }
export { createBundleBuilder }
