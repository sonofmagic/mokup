import type { HttpMethod, VitePluginOptions } from './types'

import {
  normalizeIgnorePrefix as normalizeIgnorePrefixShared,
  normalizeMethod as normalizeMethodShared,
  normalizePrefix as normalizePrefixShared,
  resolveDirs as resolveDirsShared,
} from '@mokup/shared/scan-utils'

/**
 * Normalize a method string to a supported HttpMethod.
 *
 * @param method - Raw method input.
 * @returns Normalized method or undefined.
 *
 * @example
 * import { normalizeMethod } from 'mokup/vite'
 *
 * const method = normalizeMethod('post')
 */
export function normalizeMethod(method?: string | null): HttpMethod | undefined {
  return normalizeMethodShared(method) as HttpMethod | undefined
}

/**
 * Normalize a URL prefix to a leading-slash form.
 *
 * @param prefix - Raw prefix input.
 * @returns Normalized prefix.
 *
 * @example
 * import { normalizePrefix } from 'mokup/vite'
 *
 * const prefix = normalizePrefix('api')
 */
export const normalizePrefix = normalizePrefixShared

/**
 * Resolve directory inputs into absolute paths.
 *
 * @param dir - Directory input.
 * @param root - Project root.
 * @returns Absolute directory list.
 *
 * @example
 * import { resolveDirs } from 'mokup/vite'
 *
 * const dirs = resolveDirs('mock', process.cwd())
 */
export function resolveDirs(
  dir: VitePluginOptions['dir'],
  root: string,
): string[] {
  return resolveDirsShared(dir, root)
}

/**
 * Normalize ignore-prefix values into a list.
 *
 * @param value - Prefix input.
 * @param fallback - Default prefixes.
 * @returns Normalized prefixes.
 *
 * @example
 * import { normalizeIgnorePrefix } from 'mokup/vite'
 *
 * const prefixes = normalizeIgnorePrefix(undefined, ['.'])
 */
export const normalizeIgnorePrefix = normalizeIgnorePrefixShared

export {
  hasIgnoredPrefix,
  isInDirs,
  matchesFilter,
  normalizePathForComparison,
  toPosix,
} from '@mokup/shared/path-utils'
export { createDebouncer, delay } from '@mokup/shared/timing'
