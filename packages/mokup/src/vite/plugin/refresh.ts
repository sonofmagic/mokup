import type { PreviewServer, ViteDevServer } from 'vite'
import type { RouteConfigInfo, RouteIgnoreInfo, RouteSkipInfo } from '../../core/scanner'
import type { RouteTable, VitePluginOptions } from '../../shared/types'
import type { PluginState } from './state'
import { createHonoApp } from '../../core/middleware'
import { sortRoutes } from '../../core/routes'
import { scanRoutes } from '../../core/scanner'
import { resolveDirs } from '../../shared/utils'
import { buildRouteSignature } from './routes'
import { isViteDevServer } from './server'

function createRouteRefresher(params: {
  state: PluginState
  optionList: VitePluginOptions[]
  root: () => string
  logger: Parameters<typeof scanRoutes>[0]['logger']
  enableViteMiddleware: boolean
}) {
  const { state, optionList, root, logger, enableViteMiddleware } = params

  return async (server?: ViteDevServer | PreviewServer) => {
    const collected: RouteTable = []
    const collectedServer: RouteTable = []
    const collectedSw: RouteTable = []
    const collectedDisabled: RouteSkipInfo[] = []
    const collectedIgnored: RouteIgnoreInfo[] = []
    const collectedConfigs: RouteConfigInfo[] = []
    for (const entry of optionList) {
      const dirs = resolveDirs(entry.dir, root())
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
    state.routes = sortRoutes(collected)
    state.serverRoutes = sortRoutes(collectedServer)
    state.swRoutes = sortRoutes(collectedSw)
    state.disabledRoutes = collectedDisabled
    state.ignoredRoutes = collectedIgnored
    const configMap = new Map(collectedConfigs.map(entry => [entry.file, entry]))
    const resolvedConfigs = Array.from(configMap.values())
    state.configFiles = resolvedConfigs.filter(entry => entry.enabled)
    state.disabledConfigFiles = resolvedConfigs.filter(entry => !entry.enabled)
    state.app = enableViteMiddleware && state.serverRoutes.length > 0
      ? createHonoApp(state.serverRoutes)
      : null
    const signature = buildRouteSignature(
      state.routes,
      state.disabledRoutes,
      state.ignoredRoutes,
      state.configFiles,
      state.disabledConfigFiles,
    )
    if (isViteDevServer(server) && server.ws) {
      if (state.lastSignature && signature !== state.lastSignature) {
        server.ws.send({
          type: 'custom',
          event: 'mokup:routes-changed',
          data: { ts: Date.now() },
        })
      }
    }
    state.lastSignature = signature
  }
}

export { createRouteRefresher }
