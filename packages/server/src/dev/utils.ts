import type { DirInput } from '@mokup/shared'
import type { HttpMethod } from './types'

import { isAbsolute, relative, resolve } from '@mokup/shared/pathe'
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
 * Create a debounce wrapper for a function.
 *
 * @param delayMs - Delay in milliseconds.
 * @param fn - Callback to debounce.
 * @returns Debounced function.
 *
 * @example
 * import { createDebouncer } from '@mokup/server'
 *
 * const run = createDebouncer(100, () => console.log('tick'))
 */
export function createDebouncer(delayMs: number, fn: () => void) {
  let timer: NodeJS.Timeout | null = null
  return () => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = null
      fn()
    }, delayMs)
  }
}

/**
 * Convert a path to POSIX separators.
 *
 * @param value - Input path.
 * @returns POSIX path.
 *
 * @example
 * import { toPosix } from '@mokup/server'
 *
 * const path = toPosix('a\\\\b')
 */
export function toPosix(value: string) {
  return value.replace(/\\/g, '/')
}

/**
 * Check if a file path is within any of the provided directories.
 *
 * @param file - Absolute file path.
 * @param dirs - List of directories.
 * @returns True when file is inside any dir.
 *
 * @example
 * import { isInDirs } from '@mokup/server'
 *
 * const ok = isInDirs('/root/mock/a.ts', ['/root/mock'])
 */
export function isInDirs(file: string, dirs: string[]) {
  const normalized = toPosix(file)
  return dirs.some((dir) => {
    const normalizedDir = toPosix(dir).replace(/\/$/, '')
    return normalized === normalizedDir || normalized.startsWith(`${normalizedDir}/`)
  })
}

function testPatterns(patterns: RegExp | RegExp[], value: string) {
  const list = Array.isArray(patterns) ? patterns : [patterns]
  return list.some(pattern => pattern.test(value))
}

/**
 * Apply include/exclude filters to a file path.
 *
 * @param file - File path.
 * @param include - Include patterns.
 * @param exclude - Exclude patterns.
 * @returns True if file passes the filter.
 *
 * @example
 * import { matchesFilter } from '@mokup/server'
 *
 * const ok = matchesFilter('mock/user.get.ts', /\.get\.ts$/)
 */
export function matchesFilter(
  file: string,
  include?: RegExp | RegExp[],
  exclude?: RegExp | RegExp[],
) {
  const normalized = toPosix(file)
  if (exclude && testPatterns(exclude, normalized)) {
    return false
  }
  if (include) {
    return testPatterns(include, normalized)
  }
  return true
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

/**
 * Check whether a file path contains ignored prefixes.
 *
 * @param file - Absolute file path.
 * @param rootDir - Root directory.
 * @param prefixes - Ignored prefixes.
 * @returns True if the path includes ignored segments.
 *
 * @example
 * import { hasIgnoredPrefix } from '@mokup/server'
 *
 * const ignored = hasIgnoredPrefix('/root/mock/.tmp/a.ts', '/root/mock', ['.'])
 */
export function hasIgnoredPrefix(
  file: string,
  rootDir: string,
  prefixes: string[],
) {
  if (prefixes.length === 0) {
    return false
  }
  const relativePath = toPosix(relative(rootDir, file))
  const segments = relativePath.split('/')
  return segments.some(segment =>
    prefixes.some(prefix => segment.startsWith(prefix)),
  )
}

/**
 * Delay for the given number of milliseconds.
 *
 * @param ms - Delay duration in milliseconds.
 * @returns A promise that resolves after the delay.
 *
 * @example
 * import { delay } from '@mokup/server'
 *
 * await delay(50)
 */
export function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}
