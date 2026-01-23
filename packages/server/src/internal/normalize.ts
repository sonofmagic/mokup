/**
 * Normalize URLSearchParams into a record.
 *
 * @param params - URLSearchParams instance.
 * @returns Query record.
 *
 * @example
 * import { normalizeQuery } from '@mokup/server'
 *
 * const query = normalizeQuery(new URLSearchParams('a=1&a=2'))
 */
export function normalizeQuery(
  params: URLSearchParams,
): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {}
  for (const [key, value] of params.entries()) {
    const current = query[key]
    if (typeof current === 'undefined') {
      query[key] = value
    }
    else if (Array.isArray(current)) {
      current.push(value)
    }
    else {
      query[key] = [current, value]
    }
  }
  return query
}

/**
 * Normalize fetch Headers into a lowercase record.
 *
 * @param headers - Headers instance.
 * @returns Header record.
 *
 * @example
 * import { normalizeHeaders } from '@mokup/server'
 *
 * const record = normalizeHeaders(new Headers({ 'X-Test': '1' }))
 */
export function normalizeHeaders(
  headers: Headers,
): Record<string, string> {
  const record: Record<string, string> = {}
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value
  })
  return record
}

/**
 * Normalize Node headers into a lowercase record.
 *
 * @param headers - Node header record.
 * @returns Header record.
 *
 * @example
 * import { normalizeNodeHeaders } from '@mokup/server'
 *
 * const record = normalizeNodeHeaders({ 'X-Test': '1' })
 */
export function normalizeNodeHeaders(
  headers?: Record<string, string | string[] | undefined>,
): Record<string, string> {
  if (!headers) {
    return {}
  }
  const record: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'undefined') {
      continue
    }
    record[key.toLowerCase()] = Array.isArray(value) ? value.join(',') : String(value)
  }
  return record
}

/**
 * Resolve an input URL using request headers as a base.
 *
 * @param input - Request URL or path.
 * @param headers - Headers with optional host.
 * @returns Resolved URL.
 *
 * @example
 * import { resolveUrl } from '@mokup/server'
 *
 * const url = resolveUrl('/api/ping', { host: 'localhost:3000' })
 */
export function resolveUrl(
  input: string,
  headers: Record<string, string> & { host?: string },
): URL {
  if (/^https?:\/\//.test(input)) {
    return new URL(input)
  }
  const host = headers.host
  const base = host ? `http://${host}` : 'http://localhost'
  return new URL(input, base)
}
