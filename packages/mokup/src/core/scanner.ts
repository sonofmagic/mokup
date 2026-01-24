import type { PreviewServer, ViteDevServer } from 'vite'

import type { HttpMethod, Logger, RouteDirectoryConfig, RouteRule, RouteTable } from '../shared/types'
import { collectFiles, isConfigFile, isSupportedFile } from '../shared/files'
import { hasIgnoredPrefix, normalizeIgnorePrefix, toPosix } from '../shared/utils'
import { resolveDirectoryConfig } from './config'
import { loadRules } from './loader'
import { deriveRouteFromFile, resolveRule, sortRoutes } from './routes'

/**
 * Reasons a route file was skipped during scanning.
 *
 * @example
 * import type { RouteSkipReason } from 'mokup/vite'
 *
 * const reason: RouteSkipReason = 'disabled'
 */
export type RouteSkipReason
  = | 'disabled'
    | 'disabled-dir'
    | 'exclude'
    | 'ignore-prefix'
    | 'include'

/**
 * Reasons a file was ignored during scanning.
 *
 * @example
 * import type { RouteIgnoreReason } from 'mokup/vite'
 *
 * const reason: RouteIgnoreReason = 'unsupported'
 */
export type RouteIgnoreReason
  = | 'unsupported'
    | 'invalid-route'

/**
 * Directory config discovery metadata.
 *
 * @example
 * import type { RouteConfigInfo } from 'mokup/vite'
 *
 * const info: RouteConfigInfo = { file: 'mock/index.config.ts', enabled: true }
 */
export interface RouteConfigInfo {
  /** Config file path. */
  file: string
  /**
   * Whether this config enables routes.
   *
   * @default true
   */
  enabled: boolean
}

/**
 * Decision chain entry for explaining disabled/ignored routes.
 *
 * @example
 * import type { RouteDecisionStep } from 'mokup/vite'
 *
 * const step: RouteDecisionStep = { step: 'config.enabled', result: 'pass' }
 */
export interface RouteDecisionStep {
  /** Decision step identifier. */
  step: string
  /** Pass or fail outcome for the step. */
  result: 'pass' | 'fail'
  /** Optional source file for the decision (e.g. config path). */
  source?: string
  /** Optional detail about the step. */
  detail?: string
}

/**
 * Effective configuration snapshot for a route.
 *
 * @example
 * import type { RouteEffectiveConfig } from 'mokup/vite'
 *
 * const config: RouteEffectiveConfig = { status: 404 }
 */
export interface RouteEffectiveConfig {
  headers?: Record<string, string>
  status?: number
  delay?: number
  enabled?: boolean
  ignorePrefix?: string | string[]
  include?: string | string[]
  exclude?: string | string[]
}

/**
 * Metadata for a skipped route.
 *
 * @example
 * import type { RouteSkipInfo } from 'mokup/vite'
 *
 * const info: RouteSkipInfo = {
 *   file: 'mock/disabled.get.ts',
 *   reason: 'disabled',
 * }
 */
export interface RouteSkipInfo {
  /** Route file path. */
  file: string
  /** Skip reason. */
  reason: RouteSkipReason
  /** Derived method (when available). */
  method?: HttpMethod
  /** Derived URL template (when available). */
  url?: string
  /** Ordered config file chain (root to leaf). */
  configChain?: string[]
  /** Decision chain for why the route was skipped. */
  decisionChain?: RouteDecisionStep[]
  /** Effective config snapshot for the route. */
  effectiveConfig?: RouteEffectiveConfig
}

/**
 * Metadata for an ignored file.
 *
 * @example
 * import type { RouteIgnoreInfo } from 'mokup/vite'
 *
 * const info: RouteIgnoreInfo = { file: 'mock/notes.txt', reason: 'unsupported' }
 */
export interface RouteIgnoreInfo {
  /** Ignored file path. */
  file: string
  /** Ignore reason. */
  reason: RouteIgnoreReason
  /** Ordered config file chain (root to leaf). */
  configChain?: string[]
  /** Decision chain for why the file was ignored. */
  decisionChain?: RouteDecisionStep[]
  /** Effective config snapshot for the file. */
  effectiveConfig?: RouteEffectiveConfig
}

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
  if (value.length === 0) {
    return undefined
  }
  return value.length === 1 ? value[0] : [...value]
}

function formatList(value: string[]) {
  return value.join(', ')
}

function testPatterns(patterns: RegExp | RegExp[], value: string) {
  const list = Array.isArray(patterns) ? patterns : [patterns]
  return list.some(pattern => pattern.test(value))
}

function buildEffectiveConfig(params: {
  config: Awaited<ReturnType<typeof resolveDirectoryConfig>>
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

/**
 * Scan directories for mock routes and build the route table.
 *
 * @param params - Scanner configuration.
 * @returns The resolved route table.
 *
 * @example
 * import { scanRoutes } from 'mokup/vite'
 *
 * const routes = await scanRoutes({
 *   dirs: ['/project/mock'],
 *   prefix: '/api',
 *   logger: console,
 * })
 */
export async function scanRoutes(params: {
  dirs: string[]
  prefix: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  ignorePrefix?: string | string[]
  server?: ViteDevServer | PreviewServer
  logger: Logger
  onSkip?: (info: RouteSkipInfo) => void
  onIgnore?: (info: RouteIgnoreInfo) => void
  onConfig?: (info: RouteConfigInfo) => void
}): Promise<RouteTable> {
  const routes: RouteTable = []
  const seen = new Set<string>()
  const files = await collectFiles(params.dirs)
  const globalIgnorePrefix = normalizeIgnorePrefix(params.ignorePrefix)
  const configCache = new Map<string, RouteDirectoryConfig | null>()
  const fileCache = new Map<string, string | null>()
  const shouldCollectSkip = typeof params.onSkip === 'function'
  const shouldCollectIgnore = typeof params.onIgnore === 'function'
  const shouldCollectConfig = typeof params.onConfig === 'function'
  for (const fileInfo of files) {
    if (isConfigFile(fileInfo.file)) {
      if (shouldCollectConfig) {
        const configParams: Parameters<typeof resolveDirectoryConfig>[0] = {
          file: fileInfo.file,
          rootDir: fileInfo.rootDir,
          logger: params.logger,
          configCache,
          fileCache,
        }
        if (params.server) {
          configParams.server = params.server
        }
        const config = await resolveDirectoryConfig(configParams)
        params.onConfig?.({ file: fileInfo.file, enabled: config.enabled !== false })
      }
      continue
    }
    const configParams: Parameters<typeof resolveDirectoryConfig>[0] = {
      file: fileInfo.file,
      rootDir: fileInfo.rootDir,
      logger: params.logger,
      configCache,
      fileCache,
    }
    if (params.server) {
      configParams.server = params.server
    }
    const config = await resolveDirectoryConfig(configParams)
    const configChain = config.configChain ?? []
    const configSources = config.configSources ?? {}
    const decisionChain: RouteDecisionStep[] = []
    const isConfigEnabled = config.enabled !== false
    decisionChain.push({
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
      : params.include
    const effectiveExclude = typeof config.exclude !== 'undefined'
      ? config.exclude
      : params.exclude
    const effectiveConfig = buildEffectiveConfig({
      config,
      effectiveInclude,
      effectiveExclude,
      effectiveIgnorePrefix,
    })
    const effectiveConfigValue = Object.keys(effectiveConfig).length > 0
      ? effectiveConfig
      : undefined
    if (!isConfigEnabled) {
      if (shouldCollectSkip && isSupportedFile(fileInfo.file)) {
        const resolved = resolveSkipRoute({
          file: fileInfo.file,
          rootDir: fileInfo.rootDir,
          prefix: params.prefix,
        })
        params.onSkip?.(buildSkipInfo(
          fileInfo.file,
          'disabled-dir',
          resolved,
          configChain,
          decisionChain,
          effectiveConfigValue,
        ))
      }
      continue
    }
    if (effectiveIgnorePrefix.length > 0) {
      const ignoredByPrefix = hasIgnoredPrefix(fileInfo.file, fileInfo.rootDir, effectiveIgnorePrefix)
      decisionChain.push({
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
            prefix: params.prefix,
          })
          params.onSkip?.(buildSkipInfo(
            fileInfo.file,
            'ignore-prefix',
            resolved,
            configChain,
            decisionChain,
            effectiveConfigValue,
          ))
        }
        continue
      }
    }
    const supportedFile = isSupportedFile(fileInfo.file)
    decisionChain.push({
      step: 'file.supported',
      result: supportedFile ? 'pass' : 'fail',
      detail: supportedFile ? undefined : 'unsupported file type',
    })
    if (!supportedFile) {
      if (shouldCollectIgnore) {
        params.onIgnore?.({
          file: fileInfo.file,
          reason: 'unsupported',
          configChain,
          decisionChain,
          effectiveConfig: effectiveConfigValue,
        })
      }
      continue
    }
    const normalizedFile = toPosix(fileInfo.file)
    if (typeof effectiveExclude !== 'undefined') {
      const excluded = testPatterns(effectiveExclude, normalizedFile)
      const patterns = toFilterStrings(effectiveExclude)
      decisionChain.push({
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
            prefix: params.prefix,
          })
          params.onSkip?.(buildSkipInfo(
            fileInfo.file,
            'exclude',
            resolved,
            configChain,
            decisionChain,
            effectiveConfigValue,
          ))
        }
        continue
      }
    }
    if (typeof effectiveInclude !== 'undefined') {
      const included = testPatterns(effectiveInclude, normalizedFile)
      const patterns = toFilterStrings(effectiveInclude)
      decisionChain.push({
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
            prefix: params.prefix,
          })
          params.onSkip?.(buildSkipInfo(
            fileInfo.file,
            'include',
            resolved,
            configChain,
            decisionChain,
            effectiveConfigValue,
          ))
        }
        continue
      }
    }
    const derived = deriveRouteFromFile(fileInfo.file, fileInfo.rootDir, params.logger)
    if (!derived) {
      if (shouldCollectIgnore) {
        decisionChain.push({
          step: 'route.derived',
          result: 'fail',
          source: fileInfo.file,
          detail: 'invalid route name',
        })
        params.onIgnore?.({
          file: fileInfo.file,
          reason: 'invalid-route',
          configChain,
          decisionChain,
          effectiveConfig: effectiveConfigValue,
        })
      }
      continue
    }
    decisionChain.push({
      step: 'route.derived',
      result: 'pass',
      source: fileInfo.file,
    })
    const rules = await loadRules(fileInfo.file, params.server, params.logger)
    for (const [index, rule] of rules.entries()) {
      if (!rule || typeof rule !== 'object') {
        continue
      }
      if (rule.enabled === false) {
        if (shouldCollectSkip) {
          const resolved = resolveSkipRoute({
            file: fileInfo.file,
            rootDir: fileInfo.rootDir,
            prefix: params.prefix,
            derived,
          })
          const ruleDecisionStep: RouteDecisionStep = {
            step: 'rule.enabled',
            result: 'fail',
            source: fileInfo.file,
            detail: 'enabled=false',
          }
          const ruleDecisionChain = [...decisionChain, ruleDecisionStep]
          params.onSkip?.(buildSkipInfo(
            fileInfo.file,
            'disabled',
            resolved,
            configChain,
            ruleDecisionChain,
            effectiveConfigValue,
          ))
        }
        continue
      }
      const ruleValue = rule as unknown as Record<string, unknown>
      const unsupportedKeys = ['response', 'url', 'method'].filter(
        key => key in ruleValue,
      )
      if (unsupportedKeys.length > 0) {
        params.logger.warn(
          `Skip mock with unsupported fields (${unsupportedKeys.join(', ')}): ${fileInfo.file}`,
        )
        continue
      }
      if (typeof rule.handler === 'undefined') {
        params.logger.warn(`Skip mock without handler: ${fileInfo.file}`)
        continue
      }
      const resolved = resolveRule({
        rule,
        derivedTemplate: derived.template,
        derivedMethod: derived.method,
        prefix: params.prefix,
        file: fileInfo.file,
        logger: params.logger,
      })
      if (!resolved) {
        continue
      }
      resolved.ruleIndex = index
      if (configChain.length > 0) {
        resolved.configChain = configChain
      }
      if (config.headers) {
        resolved.headers = { ...config.headers, ...(resolved.headers ?? {}) }
      }
      if (typeof resolved.status === 'undefined' && typeof config.status === 'number') {
        resolved.status = config.status
      }
      if (typeof resolved.delay === 'undefined' && typeof config.delay === 'number') {
        resolved.delay = config.delay
      }
      if (config.middlewares.length > 0) {
        resolved.middlewares = config.middlewares
      }
      const key = `${resolved.method} ${resolved.template}`
      if (seen.has(key)) {
        params.logger.warn(`Duplicate mock route ${key} from ${fileInfo.file}`)
      }
      seen.add(key)
      routes.push(resolved)
    }
  }
  return sortRoutes(routes)
}
