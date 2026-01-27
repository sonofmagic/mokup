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

/**
 * Normalize an HTTP method to the supported union.
 *
 * @param method - Raw method string.
 * @returns A normalized HttpMethod or undefined if unsupported.
 *
 * @example
 * import { normalizeMethod } from '@mokup/runtime'
 *
 * const method = normalizeMethod('post')
 */
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

/**
 * Merge header records, letting overrides win.
 *
 * @param base - Base headers.
 * @param override - Optional overrides.
 * @returns A merged header record.
 *
 * @example
 * import { mergeHeaders } from '@mokup/runtime'
 *
 * const headers = mergeHeaders({ a: '1' }, { a: '2', b: '3' })
 */
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

export { delay } from '@mokup/shared/timing'
