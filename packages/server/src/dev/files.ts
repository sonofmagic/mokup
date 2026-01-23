import { promises as fs } from 'node:fs'

import { basename, extname, join } from '@mokup/shared/pathe'

import { configExtensions, supportedExtensions } from './constants'

/**
 * File entry discovered during directory scans.
 *
 * @example
 * import type { FileInfo } from '@mokup/server'
 *
 * const info: FileInfo = {
 *   file: '/project/mock/user.get.ts',
 *   rootDir: '/project/mock',
 * }
 */
export interface FileInfo {
  /** Absolute file path. */
  file: string
  /** Root directory this file belongs to. */
  rootDir: string
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

async function exists(path: string) {
  try {
    await fs.stat(path)
    return true
  }
  catch {
    return false
  }
}

/**
 * Collect all files under the provided directories.
 *
 * @param dirs - Directories to scan.
 * @returns List of discovered files.
 *
 * @example
 * import { collectFiles } from '@mokup/server'
 *
 * const files = await collectFiles(['/project/mock'])
 */
export async function collectFiles(dirs: string[]): Promise<FileInfo[]> {
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
 * Check whether a file is a supported mock route source.
 *
 * @param file - File path to check.
 * @returns True when file is a supported route source.
 *
 * @example
 * import { isSupportedFile } from '@mokup/server'
 *
 * const ok = isSupportedFile('/project/mock/user.get.ts')
 */
export function isSupportedFile(file: string) {
  if (file.endsWith('.d.ts')) {
    return false
  }
  if (isConfigFile(file)) {
    return false
  }
  const ext = extname(file).toLowerCase()
  return supportedExtensions.has(ext)
}

/**
 * Check whether a file is a directory config file.
 *
 * @param file - File path to check.
 * @returns True when file is an index.config.* file.
 *
 * @example
 * import { isConfigFile } from '@mokup/server'
 *
 * const ok = isConfigFile('/project/mock/index.config.ts')
 */
export function isConfigFile(file: string) {
  if (file.endsWith('.d.ts')) {
    return false
  }
  const base = basename(file)
  if (!base.startsWith('index.config.')) {
    return false
  }
  const ext = extname(file).toLowerCase()
  return configExtensions.includes(ext as (typeof configExtensions)[number])
}
