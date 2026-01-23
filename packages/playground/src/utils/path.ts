/**
 * Normalize a base path for the playground routes endpoint.
 *
 * @param pathname - Raw base path.
 * @returns Normalized base path.
 *
 * @example
 * import { normalizeBasePath } from '@mokup/playground'
 *
 * const base = normalizeBasePath('/__mokup/')
 */
export function normalizeBasePath(pathname: string) {
  const trimmed = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname
  if (trimmed === '/') {
    return ''
  }
  return trimmed.endsWith('/index.html')
    ? trimmed.slice(0, -'/index.html'.length)
    : trimmed
}

/**
 * Convert a path to POSIX separators.
 *
 * @param value - Input path.
 * @returns POSIX path.
 *
 * @example
 * import { toPosixPath } from '@mokup/playground'
 *
 * const path = toPosixPath('a\\\\b')
 */
export function toPosixPath(value: string) {
  return value.replace(/\\/g, '/')
}
