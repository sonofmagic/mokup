import type { BuildOptions, FileInfo } from './types'

import { promises as fs } from 'node:fs'

import { basename, extname, isAbsolute, join, resolve } from '@mokup/shared/pathe'

const supportedExtensions = new Set([
  '.json',
  '.jsonc',
  '.ts',
  '.js',
  '.mjs',
  '.cjs',
])

async function exists(path: string) {
  try {
    await fs.stat(path)
    return true
  }
  catch {
    return false
  }
}

async function walkDir(
  dir: string,
  rootDir: string,
  files: FileInfo[],
) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue
    }
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walkDir(fullPath, rootDir, files)
      continue
    }
    if (entry.isFile()) {
      files.push({ file: fullPath, rootDir })
    }
  }
}

/**
 * Collect all files under the provided directories.
 *
 * @param dirs - Directories to scan.
 * @returns List of discovered files.
 *
 * @example
 * import { collectFiles } from '@mokup/cli'
 *
 * const files = await collectFiles(['mock'])
 */
export async function collectFiles(dirs: string[]) {
  const files: FileInfo[] = []
  for (const dir of dirs) {
    if (!(await exists(dir))) {
      continue
    }
    await walkDir(dir, dir, files)
  }
  return files
}

/**
 * Resolve directory inputs into absolute paths.
 *
 * @param dir - Directory input.
 * @param root - Project root.
 * @returns Absolute directory list.
 *
 * @example
 * import { resolveDirs } from '@mokup/cli'
 *
 * const dirs = resolveDirs('mock', process.cwd())
 */
export function resolveDirs(dir: BuildOptions['dir'], root: string): string[] {
  const raw = dir
  const resolved = Array.isArray(raw) ? raw : raw ? [raw] : ['mock']
  const normalized = resolved.map(entry =>
    isAbsolute(entry) ? entry : resolve(root, entry),
  )
  return Array.from(new Set(normalized))
}

/**
 * Normalize ignore prefixes into a list.
 *
 * @param value - Prefix input.
 * @param fallback - Default prefixes.
 * @returns Normalized prefixes.
 *
 * @example
 * import { normalizeIgnorePrefix } from '@mokup/cli'
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
 * Check whether a file path includes ignored prefixes.
 *
 * @param file - Absolute file path.
 * @param rootDir - Root directory.
 * @param prefixes - Ignored prefixes.
 * @returns True if the path contains ignored segments.
 *
 * @example
 * import { hasIgnoredPrefix } from '@mokup/cli'
 *
 * const ignored = hasIgnoredPrefix('/root/mock/.tmp/a.ts', '/root/mock', ['.'])
 */
export { hasIgnoredPrefix, matchesFilter } from '@mokup/shared/path-utils'

/**
 * Check whether a file is supported for manifest build.
 *
 * @param file - File path to check.
 * @returns True when file is a supported mock source.
 *
 * @example
 * import { isSupportedFile } from '@mokup/cli'
 *
 * const ok = isSupportedFile('mock/ping.get.ts')
 */
export function isSupportedFile(file: string) {
  if (file.endsWith('.d.ts')) {
    return false
  }
  if (basename(file).startsWith('index.config.')) {
    return false
  }
  const ext = extname(file).toLowerCase()
  return supportedExtensions.has(ext)
}
