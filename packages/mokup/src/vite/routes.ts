import type { HttpMethod, MockRule, ResolvedRoute } from './types'

import { basename, dirname, extname, join, relative } from 'pathe'
import { methodSuffixSet } from './constants'
import { normalizeMethod, normalizePrefix, normalizeUrl, toPosix } from './utils'

function resolveMethod(
  fileMethod: HttpMethod | undefined,
  ruleMethod: string | undefined,
  logger: { warn: (...args: unknown[]) => void },
): HttpMethod {
  if (fileMethod) {
    return fileMethod
  }
  const normalized = normalizeMethod(ruleMethod)
  if (normalized) {
    return normalized
  }
  if (ruleMethod) {
    logger.warn(`Unknown method "${ruleMethod}", falling back to GET`)
  }
  return 'GET'
}

function resolveUrl(url: string, prefix: string) {
  const normalized = normalizeUrl(url)
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
  const sanitized = base.endsWith('.mock')
    ? base.slice(0, -'.mock'.length)
    : base
  const segments = sanitized.split('.')
  const last = segments.at(-1)
  if (last && methodSuffixSet.has(last.toLowerCase())) {
    segments.pop()
    return {
      name: segments.join('.') || sanitized,
      method: last.toUpperCase() as HttpMethod,
    }
  }
  return {
    name: sanitized,
    method: undefined,
  }
}

export function deriveRouteFromFile(file: string, rootDir: string) {
  const rel = toPosix(relative(rootDir, file))
  const ext = extname(rel)
  const withoutExt = rel.slice(0, rel.length - ext.length)
  const dir = dirname(withoutExt)
  const base = basename(withoutExt)
  const { name, method } = stripMethodSuffix(base)
  const joined = dir === '.' ? name : join(dir, name)
  let url = `/${toPosix(joined)}`
  if (url.endsWith('/index')) {
    url = url.slice(0, -'/index'.length) || '/'
  }
  return {
    url,
    method,
  }
}

export function resolveRule(params: {
  rule: MockRule
  derivedUrl: string
  derivedMethod?: HttpMethod
  prefix: string
  file: string
  logger: { warn: (...args: unknown[]) => void }
}): ResolvedRoute | null {
  const method = resolveMethod(params.derivedMethod, params.rule.method, params.logger)
  const url = resolveUrl(params.rule.url ?? params.derivedUrl, params.prefix)
  if (!method || !url) {
    params.logger.warn(`Invalid mock route in ${params.file}`)
    return null
  }
  return {
    file: params.file,
    url,
    method,
    response: params.rule.response,
    status: params.rule.status,
    headers: params.rule.headers,
    delay: params.rule.delay,
  }
}
