import type { HttpMethod } from './types'

const methodSet = new Set<HttpMethod>([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
])

export function normalizeMethod(method?: string | null): HttpMethod | undefined {
  if (!method) {
    return undefined
  }
  const normalized = method.toUpperCase()
  if (methodSet.has(normalized as HttpMethod)) {
    return normalized as HttpMethod
  }
  return undefined
}

export function mergeHeaders(
  base: Record<string, string>,
  override?: Record<string, string>,
) {
  if (!override) {
    return base
  }
  return {
    ...base,
    ...override,
  }
}

export function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}
