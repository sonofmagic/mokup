/**
 * Parse JSON input from a text field with error handling.
 *
 * @param input - Raw input string.
 * @returns Parsed value or null on failure.
 *
 * @example
 * import { parseJsonInput } from '@mokup/playground'
 *
 * const value = parseJsonInput('{\"ok\":true}')
 */
export function parseJsonInput(input: string) {
  const trimmed = input.trim()
  if (!trimmed) {
    return { value: undefined as Record<string, unknown> | undefined }
  }
  try {
    return { value: JSON.parse(trimmed) as Record<string, unknown> }
  }
  catch (err) {
    return { error: err instanceof Error ? err.message : 'Invalid JSON' }
  }
}

/**
 * Apply query parameters to a URL instance.
 *
 * @param url - URL instance to mutate.
 * @param query - Query params object.
 *
 * @example
 * import { applyQuery } from '@mokup/playground'
 *
 * const url = new URL('http://localhost/')
 * applyQuery(url, { q: 'test' })
 */
export function applyQuery(url: URL, query: Record<string, unknown>) {
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'undefined') {
      continue
    }
    if (Array.isArray(value)) {
      value.forEach(item => url.searchParams.append(key, String(item)))
    }
    else {
      url.searchParams.set(key, String(value))
    }
  }
}
