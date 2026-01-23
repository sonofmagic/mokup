import type { RouteToken } from '@mokup/runtime'
import type { RouteParamField, RouteParamKind } from '../../types'

function formatParamToken(kind: RouteParamKind, name: string) {
  if (kind === 'catchall') {
    return `[...${name}]`
  }
  if (kind === 'optional-catchall') {
    return `[[...${name}]]`
  }
  return `[${name}]`
}

function buildRouteParams(tokens: RouteToken[]) {
  const params: RouteParamField[] = []
  const seen = new Set<string>()
  for (const token of tokens) {
    if (token.type === 'static') {
      continue
    }
    if (seen.has(token.name)) {
      continue
    }
    seen.add(token.name)
    const kind = token.type
    params.push({
      id: `${kind}:${token.name}`,
      name: token.name,
      kind,
      token: formatParamToken(kind, token.name),
      required: kind !== 'optional-catchall',
    })
  }
  return params
}

function splitCatchallInput(value: string) {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? trimmed.split('/').filter(Boolean) : []
}

function buildResolvedPath(tokens: RouteToken[], values: Record<string, string>) {
  const segments: string[] = []
  const missing = new Set<string>()
  for (const token of tokens) {
    if (token.type === 'static') {
      segments.push(token.value)
      continue
    }
    const rawValue = values[token.name]?.trim() ?? ''
    if (!rawValue) {
      if (token.type !== 'optional-catchall') {
        missing.add(token.name)
      }
      continue
    }
    if (token.type === 'param') {
      segments.push(encodeURIComponent(rawValue))
      continue
    }
    const catchallSegments = splitCatchallInput(rawValue).map(encodeURIComponent)
    if (catchallSegments.length === 0) {
      if (token.type !== 'optional-catchall') {
        missing.add(token.name)
      }
      continue
    }
    segments.push(...catchallSegments)
  }
  const path = segments.length > 0 ? `/${segments.join('/')}` : '/'
  return { path, missing: [...missing] }
}

function buildDisplayPath(tokens: RouteToken[], values: Record<string, string>) {
  const segments: string[] = []
  for (const token of tokens) {
    if (token.type === 'static') {
      segments.push(token.value)
      continue
    }
    const rawValue = values[token.name]?.trim() ?? ''
    if (!rawValue) {
      if (token.type !== 'optional-catchall') {
        segments.push(formatParamToken(token.type, token.name))
      }
      continue
    }
    if (token.type === 'param') {
      segments.push(encodeURIComponent(rawValue))
      continue
    }
    const catchallSegments = splitCatchallInput(rawValue).map(encodeURIComponent)
    if (catchallSegments.length === 0) {
      if (token.type !== 'optional-catchall') {
        segments.push(formatParamToken(token.type, token.name))
      }
      continue
    }
    segments.push(...catchallSegments)
  }
  return segments.length > 0 ? `/${segments.join('/')}` : '/'
}

export { buildDisplayPath, buildResolvedPath, buildRouteParams }
