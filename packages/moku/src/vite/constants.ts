import type { HttpMethod } from './types'

export const methodSet = new Set<HttpMethod>([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
])

export const methodSuffixSet = new Set(
  Array.from(methodSet, method => method.toLowerCase()),
)

export const supportedExtensions = new Set([
  '.json',
  '.jsonc',
  '.ts',
  '.js',
  '.mjs',
  '.cjs',
])
