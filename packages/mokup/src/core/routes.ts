import type { HttpMethod, ResolvedRoute, RouteRule } from '../shared/types'

import { compareRouteScore, parseRouteTemplate } from '@mokup/runtime'
import { basename, dirname, extname, join, relative } from '@mokup/shared/pathe'
import { methodSuffixSet } from '../shared/constants'
import { normalizePrefix, toPosix } from '../shared/utils'

const jsonExtensions = new Set(['.json', '.jsonc'])

function resolveTemplate(template: string, prefix: string) {
  const normalized = template.startsWith('/') ? template : `/${template}`
  if (!prefix) {
    return normalized
  }
  const normalizedPrefix = normalizePrefix(prefix)
  if (!normalizedPrefix) {
    return normalized
  }
  if (
    normalized === normalizedPrefix
    || normalized.startsWith(`${normalizedPrefix}/`)
  ) {
    return normalized
  }
  if (normalized === '/') {
    return `${normalizedPrefix}/`
  }
  return `${normalizedPrefix}${normalized}`
}

function stripMethodSuffix(base: string) {
  const segments = base.split('.')
  const last = segments.at(-1)
  if (last && methodSuffixSet.has(last.toLowerCase())) {
    segments.pop()
    return {
      name: segments.join('.'),
      method: last.toUpperCase() as HttpMethod,
    }
  }
  return {
    name: base,
    method: undefined,
  }
}

/**
 * Derive route metadata from a file path.
 *
 * @param file - Route file path.
 * @param rootDir - Root directory for routing.
 * @param logger - Logger for warnings.
 * @param logger.warn - Warning logger.
 * @returns Parsed route info or null when invalid.
 *
 * @example
 * import { deriveRouteFromFile } from 'mokup/vite'
 *
 * const route = deriveRouteFromFile('/project/mock/ping.get.ts', '/project/mock', console)
 */
export function deriveRouteFromFile(
  file: string,
  rootDir: string,
  logger: { warn: (...args: unknown[]) => void },
) {
  const rel = toPosix(relative(rootDir, file))
  const ext = extname(rel)
  const withoutExt = rel.slice(0, rel.length - ext.length)
  const dir = dirname(withoutExt)
  const base = basename(withoutExt)
  const { name, method } = stripMethodSuffix(base)
  const resolvedMethod = method ?? (jsonExtensions.has(ext) ? 'GET' : undefined)
  if (!resolvedMethod) {
    logger.warn(`Skip mock without method suffix: ${file}`)
    return null
  }
  if (!name) {
    logger.warn(`Skip mock with empty route name: ${file}`)
    return null
  }
  const joined = dir === '.' ? name : join(dir, name)
  const segments = toPosix(joined).split('/')
  if (segments.at(-1) === 'index') {
    segments.pop()
  }
  const template = segments.length === 0 ? '/' : `/${segments.join('/')}`
  const parsed = parseRouteTemplate(template)
  if (parsed.errors.length > 0) {
    for (const error of parsed.errors) {
      logger.warn(`${error} in ${file}`)
    }
    return null
  }
  for (const warning of parsed.warnings) {
    logger.warn(`${warning} in ${file}`)
  }
  return {
    template: parsed.template,
    method: resolvedMethod,
    tokens: parsed.tokens,
    score: parsed.score,
  }
}

/**
 * Resolve a route rule into a normalized route entry.
 *
 * @param params - Rule and derived route inputs.
 * @param params.rule - Rule definition.
 * @param params.derivedTemplate - Derived route template.
 * @param params.derivedMethod - Derived HTTP method.
 * @param params.prefix - URL prefix to apply.
 * @param params.file - Source file path.
 * @param params.logger - Logger for warnings.
 * @param params.logger.warn - Warning logger.
 * @returns A resolved route or null when invalid.
 *
 * @example
 * import { resolveRule } from 'mokup/vite'
 *
 * const resolved = resolveRule({
 *   rule: { handler: () => ({ ok: true }) },
 *   derivedTemplate: '/ping',
 *   derivedMethod: 'GET',
 *   prefix: '/api',
 *   file: '/project/mock/ping.get.ts',
 *   logger: console,
 * })
 */
export function resolveRule(params: {
  rule: RouteRule
  derivedTemplate: string
  derivedMethod?: HttpMethod
  prefix: string
  file: string
  logger: { warn: (...args: unknown[]) => void }
}): ResolvedRoute | null {
  const method = params.derivedMethod
  if (!method) {
    params.logger.warn(`Skip mock without method suffix: ${params.file}`)
    return null
  }
  const template = resolveTemplate(params.derivedTemplate, params.prefix)
  const parsed = parseRouteTemplate(template)
  if (parsed.errors.length > 0) {
    for (const error of parsed.errors) {
      params.logger.warn(`${error} in ${params.file}`)
    }
    return null
  }
  for (const warning of parsed.warnings) {
    params.logger.warn(`${warning} in ${params.file}`)
  }
  const route: ResolvedRoute = {
    file: params.file,
    template: parsed.template,
    method,
    tokens: parsed.tokens,
    score: parsed.score,
    handler: params.rule.handler,
  }
  if (typeof params.rule.status === 'number') {
    route.status = params.rule.status
  }
  if (params.rule.headers) {
    route.headers = params.rule.headers
  }
  if (typeof params.rule.delay === 'number') {
    route.delay = params.rule.delay
  }
  return route
}

/**
 * Sort routes by method, score, and template.
 *
 * @param routes - Routes to sort (in place).
 * @returns The sorted routes.
 *
 * @example
 * import { sortRoutes } from 'mokup/vite'
 *
 * const routes = sortRoutes([])
 */
export function sortRoutes(routes: ResolvedRoute[]) {
  return routes.sort((a, b) => {
    if (a.method !== b.method) {
      return a.method.localeCompare(b.method)
    }
    const scoreCompare = compareRouteScore(a.score, b.score)
    if (scoreCompare !== 0) {
      return scoreCompare
    }
    return a.template.localeCompare(b.template)
  })
}
