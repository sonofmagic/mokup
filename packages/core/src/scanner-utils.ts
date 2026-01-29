import type {
  RouteDecisionStep,
  RouteEffectiveConfig,
  RouteSkipInfo,
  RouteSkipReason,
} from './scanner-types'
import type { Logger, RouteRule } from './shared/types'
import { deriveRouteFromFile, resolveRule } from './routes'

const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  log: () => {},
}

function resolveSkipRoute(params: {
  file: string
  rootDir: string
  prefix: string
  derived?: ReturnType<typeof deriveRouteFromFile> | null
}) {
  const derived = params.derived ?? deriveRouteFromFile(params.file, params.rootDir, silentLogger)
  if (!derived?.method) {
    return null
  }
  const resolved = resolveRule({
    rule: { handler: null } as RouteRule,
    derivedTemplate: derived.template,
    derivedMethod: derived.method,
    prefix: params.prefix,
    file: params.file,
    logger: silentLogger,
  })
  if (!resolved) {
    return null
  }
  return {
    method: resolved.method,
    url: resolved.template,
  }
}

type ResolvedSkipRoute = ReturnType<typeof resolveSkipRoute>

function buildSkipInfo(
  file: string,
  reason: RouteSkipReason,
  resolved?: ResolvedSkipRoute,
  configChain?: string[],
  decisionChain?: RouteDecisionStep[],
  effectiveConfig?: RouteEffectiveConfig,
): RouteSkipInfo {
  const info: RouteSkipInfo = { file, reason }
  if (resolved) {
    info.method = resolved.method
    info.url = resolved.url
  }
  if (configChain && configChain.length > 0) {
    info.configChain = configChain
  }
  if (decisionChain && decisionChain.length > 0) {
    info.decisionChain = decisionChain
  }
  if (effectiveConfig && Object.keys(effectiveConfig).length > 0) {
    info.effectiveConfig = effectiveConfig
  }
  return info
}

function toFilterStrings(value?: RegExp | RegExp[]) {
  if (!value) {
    return []
  }
  const list = Array.isArray(value) ? value : [value]
  return list
    .filter((entry): entry is RegExp => entry instanceof RegExp)
    .map(entry => entry.toString())
}

function toStringList(value: string[]) {
  return value.length === 1 ? value[0]! : [...value]
}

function formatList(value: string[]) {
  return value.join(', ')
}

function testPatterns(patterns: RegExp | RegExp[], value: string) {
  const list = Array.isArray(patterns) ? patterns : [patterns]
  return list.some(pattern => pattern.test(value))
}

function buildEffectiveConfig(params: {
  config: {
    headers?: Record<string, string>
    status?: number
    delay?: number
    enabled?: boolean
    ignorePrefix?: string | string[]
    include?: RegExp | RegExp[]
    exclude?: RegExp | RegExp[]
  }
  effectiveInclude?: RegExp | RegExp[]
  effectiveExclude?: RegExp | RegExp[]
  effectiveIgnorePrefix: string[]
}) {
  const { config, effectiveInclude, effectiveExclude, effectiveIgnorePrefix } = params
  const includeList = toFilterStrings(effectiveInclude)
  const excludeList = toFilterStrings(effectiveExclude)
  const effectiveConfig: RouteEffectiveConfig = {}
  if (config.headers && Object.keys(config.headers).length > 0) {
    effectiveConfig.headers = config.headers
  }
  if (typeof config.status === 'number') {
    effectiveConfig.status = config.status
  }
  if (typeof config.delay === 'number') {
    effectiveConfig.delay = config.delay
  }
  if (typeof config.enabled !== 'undefined') {
    effectiveConfig.enabled = config.enabled
  }
  if (effectiveIgnorePrefix.length > 0) {
    effectiveConfig.ignorePrefix = toStringList(effectiveIgnorePrefix)
  }
  if (includeList.length > 0) {
    effectiveConfig.include = toStringList(includeList)
  }
  if (excludeList.length > 0) {
    effectiveConfig.exclude = toStringList(excludeList)
  }
  return effectiveConfig
}

export {
  buildEffectiveConfig,
  buildSkipInfo,
  formatList,
  resolveSkipRoute,
  testPatterns,
  toFilterStrings,
}
