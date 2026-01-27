import type { DirInput } from '@mokup/shared'
import type { HttpMethod } from './types'

import { isAbsolute, resolve } from '@mokup/shared/pathe'
import { methodSet } from './constants'

/**
 * Normalize a method string to a supported HttpMethod.
 *
 * @param method - Raw method input.
 * @returns Normalized method or undefined.
 *
 * @example
 * import { normalizeMethod } from '@mokup/server'
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
 * Normalize a URL prefix to a leading-slash form.
 *
 * @param prefix - Raw prefix input.
 * @returns Normalized prefix.
 *
 * @example
 * import { normalizePrefix } from '@mokup/server'
 *
 * const prefix = normalizePrefix('api')
 */
export function normalizePrefix(prefix: string) {
  if (!prefix) {
    return ''
  }
  const normalized = prefix.startsWith('/') ? prefix : `/${prefix}`
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

/**
 * Resolve directory inputs into absolute paths.
 *
 * @param dir - Directory input.
 * @param root - Project root.
 * @returns Absolute directory list.
 *
 * @example
 * import { resolveDirs } from '@mokup/server'
 *
 * const dirs = resolveDirs('mock', process.cwd())
 */
export function resolveDirs(
  dir: DirInput,
  root: string,
): string[] {
  const raw = typeof dir === 'function' ? dir(root) : dir
  const resolved = Array.isArray(raw) ? raw : raw ? [raw] : ['mock']
  const normalized = resolved.map(entry =>
    isAbsolute(entry) ? entry : resolve(root, entry),
  )
  return Array.from(new Set(normalized))
}

/**
 * Normalize ignore-prefix values into a list.
 *
 * @param value - Prefix input.
 * @param fallback - Default prefixes.
 * @returns Normalized prefixes.
 *
 * @example
 * import { normalizeIgnorePrefix } from '@mokup/server'
 *
 * const prefixes = normalizeIgnorePrefix(undefined, ['.'])
 */
export function normalizeIgnorePrefix(
  value: string | string[] | undefined,
  fallback: string[] = ['.'],
) {
  const list = typeof value === 'undefined'
    ? fallback
    : Array.isArray(value)
      ? value
      : [value]
  return list.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
}

export {
  hasIgnoredPrefix,
  isInDirs,
  matchesFilter,
  normalizePathForComparison,
  toPosix,
} from '@mokup/shared/path-utils'
export { createDebouncer, delay } from '@mokup/shared/timing'
