import type { RouteDecisionStep, RouteIgnoreInfo, RouteSkipInfo } from './scanner-types'
import {
  buildEffectiveConfig,
  buildSkipInfo,
  formatList,
  resolveSkipRoute,
  testPatterns,
  toFilterStrings,
} from './scanner-utils'
import { isSupportedFile } from './shared/files'
import { hasIgnoredPrefix, normalizeIgnorePrefix, toPosix } from './shared/utils'

interface ConfigSourceMap {
  headers?: string
  status?: string
  delay?: string
  enabled?: string
  ignorePrefix?: string
  include?: string
  exclude?: string
}

interface PrecheckConfig {
  headers?: Record<string, string>
  status?: number
  delay?: number
  enabled?: boolean
  ignorePrefix?: string | string[]
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  configSources?: ConfigSourceMap
}

interface PrecheckParams {
  fileInfo: { file: string, rootDir: string }
  prefix: string
  config: PrecheckConfig
  configChain: string[]
  globalIgnorePrefix: string[]
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  shouldCollectSkip: boolean
  shouldCollectIgnore: boolean
  onSkip?: (info: RouteSkipInfo) => void
  onIgnore?: (info: RouteIgnoreInfo) => void
}

interface PrecheckResult {
  decisionChain: RouteDecisionStep[]
  effectiveConfigValue?: ReturnType<typeof buildEffectiveConfig>
}

function pushDecisionStep(
  chain: RouteDecisionStep[],
  entry: {
    step: string
    result: 'pass' | 'fail'
    source?: string | undefined
    detail?: string | undefined
  },
) {
  const step: RouteDecisionStep = {
    step: entry.step,
    result: entry.result,
  }
  if (typeof entry.source !== 'undefined') {
    step.source = entry.source
  }
  if (typeof entry.detail !== 'undefined') {
    step.detail = entry.detail
  }
  chain.push(step)
}

export function runRoutePrechecks(params: PrecheckParams): PrecheckResult | null {
  const {
    fileInfo,
    prefix,
    config,
    configChain,
    globalIgnorePrefix,
    include,
    exclude,
    shouldCollectSkip,
    shouldCollectIgnore,
    onSkip,
    onIgnore,
  } = params

  const configSources = config.configSources ?? {}
  const decisionChain: RouteDecisionStep[] = []
  const isConfigEnabled = config.enabled !== false
  pushDecisionStep(decisionChain, {
    step: 'config.enabled',
    result: isConfigEnabled ? 'pass' : 'fail',
    source: configSources.enabled,
    detail: config.enabled === false
      ? 'enabled=false'
      : typeof config.enabled === 'boolean'
        ? 'enabled=true'
        : 'enabled=true (default)',
  })
  const effectiveIgnorePrefix = typeof config.ignorePrefix !== 'undefined'
    ? normalizeIgnorePrefix(config.ignorePrefix, [])
    : globalIgnorePrefix
  const effectiveInclude = typeof config.include !== 'undefined'
    ? config.include
    : include
  const effectiveExclude = typeof config.exclude !== 'undefined'
    ? config.exclude
    : exclude
  const effectiveConfigParams: Parameters<typeof buildEffectiveConfig>[0] = {
    config,
    effectiveIgnorePrefix,
  }
  if (typeof effectiveInclude !== 'undefined') {
    effectiveConfigParams.effectiveInclude = effectiveInclude
  }
  if (typeof effectiveExclude !== 'undefined') {
    effectiveConfigParams.effectiveExclude = effectiveExclude
  }
  const effectiveConfig = buildEffectiveConfig(effectiveConfigParams)
  const effectiveConfigValue = Object.keys(effectiveConfig).length > 0
    ? effectiveConfig
    : undefined
  if (!isConfigEnabled) {
    if (shouldCollectSkip && isSupportedFile(fileInfo.file)) {
      const resolved = resolveSkipRoute({
        file: fileInfo.file,
        rootDir: fileInfo.rootDir,
        prefix,
      })
      onSkip?.(buildSkipInfo(
        fileInfo.file,
        'disabled-dir',
        resolved,
        configChain,
        decisionChain,
        effectiveConfigValue,
      ))
    }
    return null
  }
  if (effectiveIgnorePrefix.length > 0) {
    const ignoredByPrefix = hasIgnoredPrefix(fileInfo.file, fileInfo.rootDir, effectiveIgnorePrefix)
    pushDecisionStep(decisionChain, {
      step: 'ignore-prefix',
      result: ignoredByPrefix ? 'fail' : 'pass',
      source: configSources.ignorePrefix,
      detail: `prefixes: ${formatList(effectiveIgnorePrefix)}`,
    })
    if (ignoredByPrefix) {
      if (shouldCollectSkip && isSupportedFile(fileInfo.file)) {
        const resolved = resolveSkipRoute({
          file: fileInfo.file,
          rootDir: fileInfo.rootDir,
          prefix,
        })
        onSkip?.(buildSkipInfo(
          fileInfo.file,
          'ignore-prefix',
          resolved,
          configChain,
          decisionChain,
          effectiveConfigValue,
        ))
      }
      return null
    }
  }
  const supportedFile = isSupportedFile(fileInfo.file)
  pushDecisionStep(decisionChain, {
    step: 'file.supported',
    result: supportedFile ? 'pass' : 'fail',
    detail: supportedFile ? undefined : 'unsupported file type',
  })
  if (!supportedFile) {
    if (shouldCollectIgnore) {
      const ignoreInfo: RouteIgnoreInfo = {
        file: fileInfo.file,
        reason: 'unsupported',
        configChain,
        decisionChain,
      }
      if (effectiveConfigValue) {
        ignoreInfo.effectiveConfig = effectiveConfigValue
      }
      onIgnore?.(ignoreInfo)
    }
    return null
  }
  const normalizedFile = toPosix(fileInfo.file)
  if (typeof effectiveExclude !== 'undefined') {
    const excluded = testPatterns(effectiveExclude, normalizedFile)
    const patterns = toFilterStrings(effectiveExclude)
    pushDecisionStep(decisionChain, {
      step: 'filter.exclude',
      result: excluded ? 'fail' : 'pass',
      source: configSources.exclude,
      detail: patterns.length > 0
        ? `${excluded ? 'matched' : 'no match'}: ${patterns.join(', ')}`
        : undefined,
    })
    if (excluded) {
      if (shouldCollectSkip) {
        const resolved = resolveSkipRoute({
          file: fileInfo.file,
          rootDir: fileInfo.rootDir,
          prefix,
        })
        onSkip?.(buildSkipInfo(
          fileInfo.file,
          'exclude',
          resolved,
          configChain,
          decisionChain,
          effectiveConfigValue,
        ))
      }
      return null
    }
  }
  if (typeof effectiveInclude !== 'undefined') {
    const included = testPatterns(effectiveInclude, normalizedFile)
    const patterns = toFilterStrings(effectiveInclude)
    pushDecisionStep(decisionChain, {
      step: 'filter.include',
      result: included ? 'pass' : 'fail',
      source: configSources.include,
      detail: patterns.length > 0
        ? `${included ? 'matched' : 'no match'}: ${patterns.join(', ')}`
        : undefined,
    })
    if (!included) {
      if (shouldCollectSkip) {
        const resolved = resolveSkipRoute({
          file: fileInfo.file,
          rootDir: fileInfo.rootDir,
          prefix,
        })
        onSkip?.(buildSkipInfo(
          fileInfo.file,
          'include',
          resolved,
          configChain,
          decisionChain,
          effectiveConfigValue,
        ))
      }
      return null
    }
  }

  const result: PrecheckResult = { decisionChain }
  if (effectiveConfigValue) {
    result.effectiveConfigValue = effectiveConfigValue
  }
  return result
}
