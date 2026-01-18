import { promises as fs } from 'node:fs'

import { basename, extname, join } from 'pathe'

import { supportedExtensions } from './constants'

export interface FileInfo {
  file: string
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
