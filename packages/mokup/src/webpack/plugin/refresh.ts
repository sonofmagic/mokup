import type { RouteConfigInfo, RouteIgnoreInfo, RouteSkipInfo } from '@mokup/core'
import type { RouteTable, VitePluginOptions } from '../../shared/types'
import type { PluginState } from './state'
import { createHonoApp, scanRoutes, sortRoutes } from '@mokup/core'
import { relative } from '@mokup/shared/pathe'
import { buildDiagnosticSummaryLines } from '../../shared/diagnostics'
import { resolveDirs, toPosix } from '../../shared/utils'

function createRouteRefresher(params: {
  state: PluginState
  optionList: VitePluginOptions[]
  root: () => string
  logger: Parameters<typeof scanRoutes>[0]['logger']
}) {
  const { state, optionList, root, logger } = params

  return async () => {
    const collected: RouteTable = []
    const collectedServer: RouteTable = []
    const collectedSw: RouteTable = []
    const collectedDisabled: RouteSkipInfo[] = []
    const collectedIgnored: RouteIgnoreInfo[] = []
    const collectedConfigs: RouteConfigInfo[] = []
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
    const diagnosticLines = buildDiagnosticSummaryLines({
      sections: [
        {
          label: 'invalid route files ignored',
          items: collectedIgnored
            .filter(info => info.reason === 'invalid-route')
            .map(info => toPosix(relative(root(), info.file))),
          advice: 'Add a method suffix like .get.ts and avoid unsupported route group segments.',
        },
      ],
    })
    const diagnosticSignature = diagnosticLines.join('\n')
    if (diagnosticSignature !== (state.lastDiagnosticsSignature ?? '')) {
      if (diagnosticLines.length > 0) {
        for (const line of diagnosticLines) {
          logger.warn(line)
        }
      }
      else if (state.lastDiagnosticsSignature) {
        logger.info('Mokup diagnostics cleared.')
      }
    }
    state.lastDiagnosticsSignature = diagnosticLines.length > 0 ? diagnosticSignature : null
    state.app = state.serverRoutes.length > 0 ? createHonoApp(state.serverRoutes) : null
  }
}

export { createRouteRefresher }
