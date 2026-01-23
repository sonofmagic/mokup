import type { HttpMethod, ManifestRoute, RouteToken } from '@mokup/runtime'
import type { RouteRule } from './types'

import { compareRouteScore, parseRouteTemplate } from '@mokup/runtime'

import { basename, dirname, extname, join, relative } from '@mokup/shared/pathe'

import { toPosix } from './utils'

const methodSet = new Set<HttpMethod>([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
])

const methodSuffixSet = new Set(
  Array.from(methodSet, method => method.toLowerCase()),
)

const jsonExtensions = new Set(['.json', '.jsonc'])

/**
 * Derived route metadata from a file path.
 *
 * @example
 * import type { DerivedRoute } from '@mokup/cli'
 *
 * const derived: DerivedRoute = {
 *   template: '/users',
 *   method: 'GET',
 *   tokens: [{ type: 'static', value: 'users' }],
 *   score: [4],
 * }
 */
export interface DerivedRoute {
  /** Route template. */
  template: string
  /** HTTP method. */
  method: HttpMethod
  /** Parsed tokens for matching. */
  tokens: RouteToken[]
  /** Score used for sorting. */
  score: number[]
}

function normalizePrefix(prefix: string) {
  if (!prefix) {
    return ''
  }
  const normalized = prefix.startsWith('/') ? prefix : `/${prefix}`
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

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
 * Derive a route template and method from a file path.
 *
 * @param file - File path.
 * @param rootDir - Root directory for routing.
 * @param log - Optional logger.
 * @returns Derived route metadata or null when invalid.
 *
 * @example
 * import { deriveRouteFromFile } from '@mokup/cli'
 *
 * const derived = deriveRouteFromFile('mock/ping.get.ts', 'mock')
 */
export function deriveRouteFromFile(
  file: string,
  rootDir: string,
  log?: (message: string) => void,
): DerivedRoute | null {
  const rel = toPosix(relative(rootDir, file))
  const ext = extname(rel)
  const withoutExt = rel.slice(0, rel.length - ext.length)
  const dir = dirname(withoutExt)
  const base = basename(withoutExt)
  const { name, method } = stripMethodSuffix(base)
  const resolvedMethod = method ?? (jsonExtensions.has(ext) ? 'GET' : undefined)
  if (!resolvedMethod) {
    log?.(`Skip mock without method suffix: ${file}`)
    return null
  }
  if (!name) {
    log?.(`Skip mock with empty route name: ${file}`)
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
      log?.(`${error} in ${file}`)
    }
    return null
  }
  for (const warning of parsed.warnings) {
    log?.(`${warning} in ${file}`)
  }
  return {
    template: parsed.template,
    method: resolvedMethod,
    tokens: parsed.tokens,
    score: parsed.score,
  }
}

/**
 * Resolve a derived route and rule into a manifest entry stub.
 *
 * @param params - Resolution parameters.
 * @returns Resolved data or null when invalid.
 *
 * @example
 * import { resolveRule } from '@mokup/cli'
 *
 * const resolved = resolveRule({
 *   rule: { handler: { ok: true } },
 *   derivedTemplate: '/ping',
 *   derivedMethod: 'GET',
 *   prefix: '/api',
 *   file: 'mock/ping.get.ts',
 * })
 */
export function resolveRule(params: {
  rule: RouteRule
  derivedTemplate: string
  derivedMethod?: HttpMethod
  prefix: string
  file: string
  log?: (message: string) => void
}) {
  const method = params.derivedMethod
  if (!method) {
    return null
  }
  const template = resolveTemplate(params.derivedTemplate, params.prefix)
  const parsed = parseRouteTemplate(template)
  if (parsed.errors.length > 0) {
    for (const error of parsed.errors) {
      params.log?.(`${error} in ${params.file}`)
    }
    return null
  }
  for (const warning of parsed.warnings) {
    params.log?.(`${warning} in ${params.file}`)
  }
  return {
    method,
    template: parsed.template,
    tokens: parsed.tokens,
    score: parsed.score,
  }
}

/**
 * Sort manifest routes by method and score.
 *
 * @param routes - Routes to sort in place.
 * @returns Sorted routes.
 *
 * @example
 * import { sortRoutes } from '@mokup/cli'
 *
 * const routes = sortRoutes([])
 */
export function sortRoutes(routes: ManifestRoute[]) {
  return routes.sort((a, b) => {
    if (a.method !== b.method) {
      return a.method.localeCompare(b.method)
    }
    return compareRouteScore(a.score ?? [], b.score ?? [])
  })
}
