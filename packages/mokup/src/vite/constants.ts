import type { HttpMethod } from './types'

/**
 * Supported HTTP methods for route detection.
 *
 * @example
 * import { methodSet } from 'mokup/vite'
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
 * import { methodSuffixSet } from 'mokup/vite'
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
 * import { supportedExtensions } from 'mokup/vite'
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
 * import { configExtensions } from 'mokup/vite'
 *
 * const ok = configExtensions.includes('.ts')
 */
export const configExtensions = ['.ts', '.js', '.mjs', '.cjs'] as const
