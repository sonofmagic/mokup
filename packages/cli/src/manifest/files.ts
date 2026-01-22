import type { BuildOptions, FileInfo } from './types'

import { promises as fs } from 'node:fs'

import { basename, extname, isAbsolute, join, relative, resolve } from '@mokup/shared/pathe'

import { toPosix } from './utils'

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

export function resolveDirs(dir: BuildOptions['dir'], root: string): string[] {
  const raw = dir
  const resolved = Array.isArray(raw) ? raw : raw ? [raw] : ['mock']
  const normalized = resolved.map(entry =>
    isAbsolute(entry) ? entry : resolve(root, entry),
  )
  return Array.from(new Set(normalized))
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
  const normalized = toPosix(file)
  if (exclude && testPatterns(exclude, normalized)) {
    return false
  }
  if (include) {
    return testPatterns(include, normalized)
  }
  return true
}

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

export function hasIgnoredPrefix(
  file: string,
  rootDir: string,
  prefixes: string[],
) {
  if (prefixes.length === 0) {
    return false
  }
  const relativePath = toPosix(relative(rootDir, file))
  const segments = relativePath.split('/')
  return segments.some(segment =>
    prefixes.some(prefix => segment.startsWith(prefix)),
  )
}

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
