export const methodSet = new Set([
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

export const configExtensions = ['.ts', '.js', '.mjs', '.cjs'] as const

export const jsonExtensions = new Set(['.json', '.jsonc'])
