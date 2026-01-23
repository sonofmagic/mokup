/**
 * Convert a path to POSIX separators.
 *
 * @param value - Input path.
 * @returns POSIX path string.
 *
 * @example
 * import { toPosix } from '@mokup/cli'
 *
 * const path = toPosix('a\\\\b')
 */
export function toPosix(value: string) {
  return value.replace(/\\/g, '/')
}
