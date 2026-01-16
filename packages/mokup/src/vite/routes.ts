import type { HttpMethod, MockRule, ResolvedRoute } from './types'

import { compareRouteScore, parseRouteTemplate } from '@mokup/runtime'
import { basename, dirname, extname, join, relative } from 'pathe'
import { methodSuffixSet } from './constants'
import { normalizeMethod, normalizePrefix, toPosix } from './utils'

function resolveMethod(
  fileMethod: HttpMethod | undefined,
  ruleMethod: string | undefined,
  logger: { warn: (...args: unknown[]) => void },
): HttpMethod {
  if (ruleMethod) {
    const normalized = normalizeMethod(ruleMethod)
    if (normalized) {
      return normalized
    }
    logger.warn(`Unknown method "${ruleMethod}", falling back to file method`)
  }
  if (fileMethod) {
    return fileMethod
  }
  return 'GET'
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
  logger: { warn: (...args: unknown[]) => void },
) {
  const rel = toPosix(relative(rootDir, file))
  const ext = extname(rel)
  const withoutExt = rel.slice(0, rel.length - ext.length)
  const dir = dirname(withoutExt)
  const base = basename(withoutExt)
  const { name, method } = stripMethodSuffix(base)
  if (!method) {
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
    method,
    tokens: parsed.tokens,
    score: parsed.score,
  }
}

export function resolveRule(params: {
  rule: MockRule
  derivedTemplate: string
  derivedMethod?: HttpMethod
  prefix: string
  file: string
  logger: { warn: (...args: unknown[]) => void }
}): ResolvedRoute | null {
  const method = resolveMethod(params.derivedMethod, params.rule.method, params.logger)
  if (!method) {
    params.logger.warn(`Invalid mock method in ${params.file}`)
    return null
  }
  const template = resolveTemplate(params.rule.url ?? params.derivedTemplate, params.prefix)
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
  return {
    file: params.file,
    template: parsed.template,
    method,
    tokens: parsed.tokens,
    score: parsed.score,
    response: params.rule.response,
    status: params.rule.status,
    headers: params.rule.headers,
    delay: params.rule.delay,
  }
}

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
