import type { VitePluginOptions } from '../../shared/types'
import type { PluginState } from './state'
import { createHonoApp } from '../../core/middleware'
import { sortRoutes } from '../../core/routes'
import { scanRoutes } from '../../core/scanner'
import { resolveDirs } from '../../shared/utils'

function createRouteRefresher(params: {
  state: PluginState
  optionList: VitePluginOptions[]
  root: () => string
  logger: Parameters<typeof scanRoutes>[0]['logger']
}) {
  const { state, optionList, root, logger } = params

  return async () => {
    const collected = []
    const collectedServer = []
    const collectedSw = []
    const collectedDisabled = []
    const collectedIgnored = []
    const collectedConfigs = []
    for (const entry of optionList) {
      const scanParams: Parameters<typeof scanRoutes>[0] = {
        dirs: resolveDirs(entry.dir, root()),
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
    state.app = state.serverRoutes.length > 0 ? createHonoApp(state.serverRoutes) : null
  }
}

export { createRouteRefresher }
