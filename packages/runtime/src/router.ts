export type RouteToken
  = | { type: 'static', value: string }
    | { type: 'param', name: string }
    | { type: 'catchall', name: string }
    | { type: 'optional-catchall', name: string }

export interface ParsedRouteTemplate {
  template: string
  tokens: RouteToken[]
  score: number[]
  errors: string[]
  warnings: string[]
}

const paramNamePattern = /^[\w-]+$/
const paramPattern = /^\[([^\]/]+)\]$/
const catchallPattern = /^\[\.\.\.([^\]/]+)\]$/
const optionalCatchallPattern = /^\[\[\.\.\.([^\]/]+)\]\]$/
const groupPattern = /^\([^)]+\)$/

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment)
  }
  catch {
    return segment
  }
}

function splitPath(value: string) {
  return normalizePathname(value).split('/').filter(Boolean)
}

function scoreToken(token: RouteToken) {
  switch (token.type) {
    case 'static':
      return 4
    case 'param':
      return 3
    case 'catchall':
      return 2
    case 'optional-catchall':
      return 1
    default:
      return 0
  }
}

export function scoreRouteTokens(tokens: RouteToken[]) {
  return tokens.map(scoreToken)
}

export function compareRouteScore(a: number[], b: number[]) {
  const min = Math.min(a.length, b.length)
  for (let i = 0; i < min; i += 1) {
    if (a[i] !== b[i]) {
      return b[i] - a[i]
    }
  }
  if (a.length !== b.length) {
    return b.length - a.length
  }
  return 0
}

export function normalizePathname(value: string) {
  const withoutQuery = value.split('?')[0].split('#')[0]
  let normalized = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }
  return normalized
}

export function parseRouteTemplate(template: string): ParsedRouteTemplate {
  const errors: string[] = []
  const warnings: string[] = []
  const normalized = normalizePathname(template)
  const segments = splitPath(normalized)
  const tokens: RouteToken[] = []
  const seenParams = new Set<string>()

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    if (groupPattern.test(segment)) {
      errors.push(`Route groups are not supported: ${segment}`)
      continue
    }

    const optionalCatchallMatch = segment.match(optionalCatchallPattern)
    if (optionalCatchallMatch) {
      const name = optionalCatchallMatch[1]
      if (!paramNamePattern.test(name)) {
        errors.push(`Invalid optional catch-all param name "${name}"`)
        continue
      }
      if (index !== segments.length - 1) {
        errors.push(`Optional catch-all "${segment}" must be the last segment`)
        continue
      }
      if (seenParams.has(name)) {
        warnings.push(`Duplicate param name "${name}"`)
      }
      seenParams.add(name)
      tokens.push({ type: 'optional-catchall', name })
      continue
    }

    const catchallMatch = segment.match(catchallPattern)
    if (catchallMatch) {
      const name = catchallMatch[1]
      if (!paramNamePattern.test(name)) {
        errors.push(`Invalid catch-all param name "${name}"`)
        continue
      }
      if (index !== segments.length - 1) {
        errors.push(`Catch-all "${segment}" must be the last segment`)
        continue
      }
      if (seenParams.has(name)) {
        warnings.push(`Duplicate param name "${name}"`)
      }
      seenParams.add(name)
      tokens.push({ type: 'catchall', name })
      continue
    }

    const paramMatch = segment.match(paramPattern)
    if (paramMatch) {
      const name = paramMatch[1]
      if (!paramNamePattern.test(name)) {
        errors.push(`Invalid param name "${name}"`)
        continue
      }
      if (seenParams.has(name)) {
        warnings.push(`Duplicate param name "${name}"`)
      }
      seenParams.add(name)
      tokens.push({ type: 'param', name })
      continue
    }

    if (segment.includes('[') || segment.includes(']') || segment.includes('(') || segment.includes(')')) {
      errors.push(`Invalid route segment "${segment}"`)
      continue
    }

    tokens.push({ type: 'static', value: segment })
  }

  return {
    template: normalized,
    tokens,
    score: scoreRouteTokens(tokens),
    errors,
    warnings,
  }
}

export function matchRouteTokens(tokens: RouteToken[], pathname: string) {
  const segments = splitPath(pathname)
  const params: Record<string, string | string[]> = {}
  let index = 0

  for (const token of tokens) {
    if (token.type === 'static') {
      if (segments[index] !== token.value) {
        return null
      }
      index += 1
      continue
    }
    if (token.type === 'param') {
      if (index >= segments.length) {
        return null
      }
      params[token.name] = decodeSegment(segments[index])
      index += 1
      continue
    }
    if (token.type === 'catchall') {
      params[token.name] = segments.slice(index).map(decodeSegment)
      index = segments.length
      continue
    }
    if (token.type === 'optional-catchall') {
      params[token.name] = segments.slice(index).map(decodeSegment)
      index = segments.length
      continue
    }
  }

  if (index !== segments.length) {
    return null
  }

  return { params }
}
