import { platform } from 'node:process'
import { normalize } from '@mokup/shared/pathe'

function isWindowsPlatform() {
  return platform === 'win32'
}

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

/**
 * Normalize a path for consistent comparisons across platforms.
 *
 * @param value - Input path.
 * @returns Normalized path for comparisons.
 *
 * @example
 * import { normalizePathForComparison } from '@mokup/cli'
 *
 * const path = normalizePathForComparison('C:\\\\Mock\\\\Users.ts')
 */
export function normalizePathForComparison(value: string) {
  const normalized = normalize(toPosix(value))
  const isWindowsLike = isWindowsPlatform()
    || /^[a-z]:\//i.test(normalized)
    || normalized.startsWith('//')
  return isWindowsLike ? normalized.toLowerCase() : normalized
}
