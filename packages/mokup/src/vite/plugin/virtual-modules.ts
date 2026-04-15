import type { ResolvedSwConfig } from '@mokup/core'
import type { PreviewServer, ViteDevServer } from 'vite'
import type { PluginState } from './state'
import { buildBundleModule, buildSwScript } from '../../internal/core'
import { buildSwLifecycleScript, resolveSwModuleImport } from './sw'

interface VirtualModuleContext {
  addWatchFile: (id: string) => void
  resolve: (id: string) => Promise<{ id: string } | null>
}

interface VirtualModuleIds {
  swVirtualId: string
  resolvedSwVirtualId: string
  swLifecycleVirtualId: string
  resolvedSwLifecycleVirtualId: string
  bundleVirtualId: string
  resolvedBundleVirtualId: string
}

function resolveMokupVirtualId(id: string, ids: VirtualModuleIds) {
  if (id === ids.swVirtualId) {
    return ids.resolvedSwVirtualId
  }
  if (id === ids.swLifecycleVirtualId) {
    return ids.resolvedSwLifecycleVirtualId
  }
  if (id === ids.bundleVirtualId) {
    return ids.resolvedBundleVirtualId
  }
  return null
}

async function loadMokupVirtualModule(
  ctx: VirtualModuleContext,
  id: string,
  params: {
    ids: VirtualModuleIds
    command: 'serve' | 'build'
    state: PluginState
    currentServer: ViteDevServer | PreviewServer | null
    refreshRoutes: (server?: ViteDevServer | PreviewServer, options?: { silent?: boolean }) => Promise<void>
    resolveAllDirs: () => string[]
    root: string
    swConfig: ResolvedSwConfig | null
    unregisterConfig: ResolvedSwConfig
    hasSwEntries: boolean
    hasSwRoutes: () => boolean
    resolveSwRequestPath: (path: string) => string
    resolveSwRegisterScope: (scope: string) => string
    swLifecycleScript: string | null
    setSwLifecycleScript: (value: string | null) => void
  },
) {
  if (id === params.ids.resolvedBundleVirtualId) {
    const shouldRefresh = params.command !== 'build' || !params.state.lastSignature
    if (shouldRefresh) {
      await params.refreshRoutes(params.currentServer ?? undefined, { silent: true })
    }
    const dirs = params.resolveAllDirs()
    for (const dir of dirs) {
      ctx.addWatchFile(dir)
    }
    for (const route of params.state.serverRoutes) {
      ctx.addWatchFile(route.file)
      route.middlewares?.forEach((entry) => {
        ctx.addWatchFile(entry.source)
      })
    }
    for (const config of params.state.configFiles) {
      ctx.addWatchFile(config.file)
    }
    for (const config of params.state.disabledConfigFiles) {
      ctx.addWatchFile(config.file)
    }
    return buildBundleModule({ routes: params.state.serverRoutes, root: params.root })
  }
  if (id !== params.ids.resolvedSwVirtualId) {
    if (id !== params.ids.resolvedSwLifecycleVirtualId) {
      return null
    }
    let lifecycleScript = params.swLifecycleScript
    if (!lifecycleScript) {
      if (params.state.swRoutes.length === 0) {
        await params.refreshRoutes()
      }
      const importPath = await resolveSwModuleImport(ctx)
      lifecycleScript = buildSwLifecycleScript({
        importPath,
        swConfig: params.swConfig,
        unregisterConfig: params.unregisterConfig,
        hasSwEntries: params.hasSwEntries,
        hasSwRoutes: params.hasSwRoutes(),
        resolveRequestPath: params.resolveSwRequestPath,
        resolveRegisterScope: params.resolveSwRegisterScope,
      })
      params.setSwLifecycleScript(lifecycleScript)
    }
    return lifecycleScript ?? ''
  }
  if (params.state.swRoutes.length === 0) {
    await params.refreshRoutes()
  }
  return buildSwScript({
    routes: params.state.swRoutes,
    root: params.root,
    basePaths: params.swConfig?.basePaths ?? [],
    ...(typeof params.state.swModuleVersion !== 'undefined'
      ? { moduleVersion: params.state.swModuleVersion }
      : {}),
  })
}

export { loadMokupVirtualModule, resolveMokupVirtualId }
