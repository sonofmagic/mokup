import type { RouteConfigInfo, RouteIgnoreInfo, RouteSkipInfo } from '@mokup/core'
import type { DiagnosticErrorMode, RouteTable, VitePluginOptions } from '../../shared/types'
import type { PluginState } from './state'
import { createHonoApp, scanRoutes, sortRoutes } from '@mokup/core'
import { createRouteDiagnosticSections, reportDiagnostics } from '@mokup/shared/diagnostics'
import { relative } from '@mokup/shared/pathe'
import { resolveDirs, toPosix } from '../../shared/utils'

const unsupportedFieldsWarningRE = /^Skip mock with unsupported fields .*: (.+)$/
const missingHandlerWarningRE = /^Skip mock without handler: (.+)$/
const duplicateRouteWarningRE = /^Duplicate mock route (.+) from .+$/

function createRouteRefresher(params: {
  state: PluginState
  optionList: VitePluginOptions[]
  root: () => string
  logger: Parameters<typeof scanRoutes>[0]['logger']
  errorOn?: DiagnosticErrorMode
}) {
  const {
    state,
    optionList,
    root,
    logger,
    errorOn,
  } = params

  return async () => {
    const unsupportedRuleFiles = new Set<string>()
    const missingHandlerFiles = new Set<string>()
    const duplicateRoutes = new Set<string>()
    const diagnosticLogger = {
      ...logger,
      warn: (...args: unknown[]) => {
        if (args.length > 0) {
          const message = args.map(String).join(' ')
          const unsupportedMatch = message.match(unsupportedFieldsWarningRE)
          if (unsupportedMatch?.[1]) {
            unsupportedRuleFiles.add(toPosix(relative(root(), unsupportedMatch[1])))
          }
          const missingHandlerMatch = message.match(missingHandlerWarningRE)
          if (missingHandlerMatch?.[1]) {
            missingHandlerFiles.add(toPosix(relative(root(), missingHandlerMatch[1])))
          }
          const duplicateRouteMatch = message.match(duplicateRouteWarningRE)
          if (duplicateRouteMatch?.[1]) {
            duplicateRoutes.add(duplicateRouteMatch[1])
          }
        }
        logger.warn(...args)
      },
    }
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
        logger: diagnosticLogger,
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
    const diagnosticSections = createRouteDiagnosticSections({
      invalidRoutes: collectedIgnored
        .filter(info => info.reason === 'invalid-route')
        .map(info => toPosix(relative(root(), info.file))),
      unsupportedFields: Array.from(unsupportedRuleFiles),
      missingHandlers: Array.from(missingHandlerFiles),
      duplicateRoutes: Array.from(duplicateRoutes),
    })
    const { error: diagnosticError, summaryLines: diagnosticLines } = reportDiagnostics({
      errorOn,
      sections: diagnosticSections,
    })
    const diagnosticSignature = diagnosticLines.join('\n')
    const previousDiagnosticsSignature = state.lastDiagnosticsSignature ?? ''
    state.lastDiagnosticsSignature = diagnosticLines.length > 0 ? diagnosticSignature : null
    if (diagnosticError) {
      throw diagnosticError
    }
    if (diagnosticSignature !== previousDiagnosticsSignature) {
      if (diagnosticLines.length > 0) {
        for (const line of diagnosticLines) {
          logger.warn(line)
        }
      }
      else if (previousDiagnosticsSignature) {
        logger.info('Mokup diagnostics cleared.')
      }
    }
    state.app = state.serverRoutes.length > 0 ? createHonoApp(state.serverRoutes) : null
  }
}

export { createRouteRefresher }
