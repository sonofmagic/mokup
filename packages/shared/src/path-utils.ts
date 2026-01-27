import { platform } from 'node:process'
import { normalize, relative } from 'pathe'

function isWindowsLikePath(normalized: string) {
  return platform === 'win32'
    || /^[a-z]:\//i.test(normalized)
    || normalized.startsWith('//')
}

export function toPosix(value: string) {
  return value.replace(/\\/g, '/')
}

function normalizePath(value: string) {
  return normalize(toPosix(value))
}

export function normalizePathForComparison(value: string) {
  const normalized = normalizePath(value)
  return isWindowsLikePath(normalized) ? normalized.toLowerCase() : normalized
}

export function isInDirs(file: string, dirs: string[]) {
  const normalized = normalizePathForComparison(file)
  return dirs.some((dir) => {
    const normalizedDir = normalizePathForComparison(dir).replace(/\/$/, '')
    return normalized === normalizedDir || normalized.startsWith(`${normalizedDir}/`)
  })
}

function testPatterns(patterns: RegExp | RegExp[], value: string) {
  const list = Array.isArray(patterns) ? patterns : [patterns]
  return list.some(pattern => pattern.test(value))
}

export function matchesFilter(
  file: string,
  include?: RegExp | RegExp[],
  exclude?: RegExp | RegExp[],
) {
  const normalized = normalizePathForComparison(file)
  if (exclude && testPatterns(exclude, normalized)) {
    return false
  }
  if (include) {
    return testPatterns(include, normalized)
  }
  return true
}

export function hasIgnoredPrefix(
  file: string,
  rootDir: string,
  prefixes: string[],
) {
  if (prefixes.length === 0) {
    return false
  }
  const normalizedRoot = normalizePathForComparison(rootDir)
  const normalizedFile = normalizePathForComparison(file)
  const relativePath = toPosix(relative(normalizedRoot, normalizedFile))
  const segments = relativePath.split('/')
  return segments.some(segment =>
    prefixes.some(prefix => segment.startsWith(prefix)),
  )
}
