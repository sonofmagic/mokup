import type { HttpMethod, Logger, RouteDirectoryConfig, RouteRule, RouteTable } from './types'
import { resolveDirectoryConfig } from './config'
import { collectFiles, isConfigFile, isSupportedFile } from './files'
import { loadRules } from './loader'
import { deriveRouteFromFile, resolveRule, sortRoutes } from './routes'
import { hasIgnoredPrefix, matchesFilter, normalizeIgnorePrefix } from './utils'

/**
 * Reasons a route file was skipped during scanning.
 *
 * @example
 * import type { RouteSkipReason } from '@mokup/server'
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
 * import type { RouteIgnoreReason } from '@mokup/server'
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
 * import type { RouteConfigInfo } from '@mokup/server'
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
 * Metadata for a skipped route.
 *
 * @example
 * import type { RouteSkipInfo } from '@mokup/server'
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
}

/**
 * Metadata for an ignored file.
 *
 * @example
 * import type { RouteIgnoreInfo } from '@mokup/server'
 *
 * const info: RouteIgnoreInfo = { file: 'mock/notes.txt', reason: 'unsupported' }
 */
export interface RouteIgnoreInfo {
  /** Ignored file path. */
  file: string
  /** Ignore reason. */
  reason: RouteIgnoreReason
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
): RouteSkipInfo {
  const info: RouteSkipInfo = { file, reason }
  if (resolved) {
    info.method = resolved.method
    info.url = resolved.url
  }
  return info
}

/**
 * Scan directories for mock routes and build the route table.
 *
 * @param params - Scanner configuration.
 * @returns The resolved route table.
 *
 * @example
 * import { scanRoutes } from '@mokup/server'
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
        const config = await resolveDirectoryConfig({
          file: fileInfo.file,
          rootDir: fileInfo.rootDir,
          logger: params.logger,
          configCache,
          fileCache,
        })
        params.onConfig?.({ file: fileInfo.file, enabled: config.enabled !== false })
      }
      continue
    }
    const config = await resolveDirectoryConfig({
      file: fileInfo.file,
      rootDir: fileInfo.rootDir,
      logger: params.logger,
      configCache,
      fileCache,
    })
    if (config.enabled === false) {
      if (shouldCollectSkip && isSupportedFile(fileInfo.file)) {
        const resolved = resolveSkipRoute({
          file: fileInfo.file,
          rootDir: fileInfo.rootDir,
          prefix: params.prefix,
        })
        params.onSkip?.(buildSkipInfo(fileInfo.file, 'disabled-dir', resolved))
      }
      continue
    }
    const effectiveIgnorePrefix = typeof config.ignorePrefix !== 'undefined'
      ? normalizeIgnorePrefix(config.ignorePrefix, [])
      : globalIgnorePrefix
    if (hasIgnoredPrefix(fileInfo.file, fileInfo.rootDir, effectiveIgnorePrefix)) {
      if (shouldCollectSkip && isSupportedFile(fileInfo.file)) {
        const resolved = resolveSkipRoute({
          file: fileInfo.file,
          rootDir: fileInfo.rootDir,
          prefix: params.prefix,
        })
        params.onSkip?.(buildSkipInfo(fileInfo.file, 'ignore-prefix', resolved))
      }
      continue
    }
    if (!isSupportedFile(fileInfo.file)) {
      if (shouldCollectIgnore) {
        params.onIgnore?.({ file: fileInfo.file, reason: 'unsupported' })
      }
      continue
    }
    const effectiveInclude = typeof config.include !== 'undefined'
      ? config.include
      : params.include
    const effectiveExclude = typeof config.exclude !== 'undefined'
      ? config.exclude
      : params.exclude
    if (!matchesFilter(fileInfo.file, effectiveInclude, effectiveExclude)) {
      if (shouldCollectSkip) {
        const resolved = resolveSkipRoute({
          file: fileInfo.file,
          rootDir: fileInfo.rootDir,
          prefix: params.prefix,
        })
        const reason = effectiveExclude && matchesFilter(fileInfo.file, undefined, effectiveExclude)
          ? 'exclude'
          : 'include'
        params.onSkip?.(buildSkipInfo(fileInfo.file, reason, resolved))
      }
      continue
    }
    const derived = deriveRouteFromFile(fileInfo.file, fileInfo.rootDir, params.logger)
    if (!derived) {
      if (shouldCollectIgnore) {
        params.onIgnore?.({ file: fileInfo.file, reason: 'invalid-route' })
      }
      continue
    }
    const rules = await loadRules(fileInfo.file, params.logger)
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
          params.onSkip?.(buildSkipInfo(fileInfo.file, 'disabled', resolved))
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
