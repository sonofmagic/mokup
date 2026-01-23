import type { HttpMethod } from './types'

/**
 * Supported HTTP methods for dev scanning.
 *
 * @example
 * import { methodSet } from '@mokup/server'
 *
 * const hasGet = methodSet.has('GET')
 */
export const methodSet = new Set<HttpMethod>([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
])

/**
 * Lowercase method suffixes used in file names.
 *
 * @example
 * import { methodSuffixSet } from '@mokup/server'
 *
 * const ok = methodSuffixSet.has('get')
 */
export const methodSuffixSet = new Set(
  Array.from(methodSet, method => method.toLowerCase()),
)

/**
 * Supported file extensions for mock routes.
 *
 * @example
 * import { supportedExtensions } from '@mokup/server'
 *
 * const ok = supportedExtensions.has('.ts')
 */
export const supportedExtensions = new Set([
  '.json',
  '.jsonc',
  '.ts',
  '.js',
  '.mjs',
  '.cjs',
])

/**
 * Extensions allowed for directory config files.
 *
 * @example
 * import { configExtensions } from '@mokup/server'
 *
 * const ok = configExtensions.includes('.ts')
 */
export const configExtensions = ['.ts', '.js', '.mjs', '.cjs'] as const
