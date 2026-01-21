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

export interface DerivedRoute {
  template: string
  method: HttpMethod
  tokens: RouteToken[]
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

export function sortRoutes(routes: ManifestRoute[]) {
  return routes.sort((a, b) => {
    if (a.method !== b.method) {
      return a.method.localeCompare(b.method)
    }
    return compareRouteScore(a.score ?? [], b.score ?? [])
  })
}
