import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  collectFiles,
  hasIgnoredPrefix,
  isSupportedFile,
  matchesFilter,
  normalizeIgnorePrefix,
  resolveDirs,
} from '../src/manifest/files'

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-cli-files-'))
  return root
}

describe('manifest file helpers', () => {
  it('collects files recursively and skips node_modules/.git', async () => {
    const root = await createTempRoot()
    const mockDir = path.join(root, 'mock')
    try {
      await fs.mkdir(path.join(mockDir, 'node_modules'), { recursive: true })
      await fs.mkdir(path.join(mockDir, '.git'), { recursive: true })
      await fs.mkdir(path.join(mockDir, 'nested'), { recursive: true })
      await fs.writeFile(path.join(mockDir, 'users.json'), '{}', 'utf8')
      await fs.writeFile(path.join(mockDir, 'node_modules', 'skip.json'), '{}', 'utf8')
      await fs.writeFile(path.join(mockDir, 'nested', 'profile.ts'), 'export {}', 'utf8')

      const files = await collectFiles([mockDir, path.join(root, 'missing')])
      const basenames = files.map(entry => path.basename(entry.file)).sort()

      expect(basenames).toEqual(['profile.ts', 'users.json'])
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('skips non-file directory entries when collecting', async () => {
    const root = await createTempRoot()
    const mockDir = path.join(root, 'mock')
    try {
      await fs.mkdir(mockDir, { recursive: true })
      const target = path.join(mockDir, 'target.json')
      const link = path.join(mockDir, 'link.json')
      await fs.writeFile(target, '{}', 'utf8')
      await fs.symlink(target, link)

      const files = await collectFiles([mockDir])
      const basenames = files.map(entry => path.basename(entry.file)).sort()

      expect(basenames).toEqual(['target.json'])
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('resolves dirs and matches include/exclude filters', () => {
    const root = '/tmp/mokup-root'
    const posixPath = path.posix
    const absDir = posixPath.join(root, 'abs')

    expect(resolveDirs(undefined, root)).toEqual([posixPath.resolve(root, 'mock')])
    expect(resolveDirs(['mock', absDir, absDir], root)).toEqual([
      posixPath.resolve(root, 'mock'),
      absDir,
    ])

    const file = posixPath.join(root, 'mock', 'users.json')
    expect(matchesFilter(file, /users/)).toBe(true)
    expect(matchesFilter(file, /posts/)).toBe(false)
    expect(matchesFilter(file, [/posts/, /users/])).toBe(true)
    expect(matchesFilter(file, /users/, /users/)).toBe(false)
  })

  it('filters supported extensions and config/d.ts files', () => {
    expect(isSupportedFile('/tmp/route.d.ts')).toBe(false)
    expect(isSupportedFile('/tmp/index.config.ts')).toBe(false)
    expect(isSupportedFile('/tmp/route.JSON')).toBe(true)
    expect(isSupportedFile('/tmp/route.ts')).toBe(true)
  })

  it('compares Windows paths without case sensitivity', () => {
    const root = String.raw`C:\Repo\Mock`
    const file = String.raw`c:\repo\mock\users.json`
    const ignored = String.raw`C:\Repo\Mock\.draft\users.get.json`

    expect(matchesFilter(file, /mock/)).toBe(true)
    expect(hasIgnoredPrefix(ignored, root, normalizeIgnorePrefix(undefined))).toBe(true)
  })

  it('normalizes ignore prefixes and checks path segments', () => {
    const root = path.posix.join('/tmp', 'mokup-root', 'mock')
    const file = path.posix.join(root, '.draft', 'users.get.json')
    expect(normalizeIgnorePrefix(undefined)).toEqual(['.'])
    expect(normalizeIgnorePrefix([''])).toEqual([])
    expect(hasIgnoredPrefix(file, root, normalizeIgnorePrefix(undefined))).toBe(true)
    expect(hasIgnoredPrefix(file, root, normalizeIgnorePrefix('_'))).toBe(false)
    expect(hasIgnoredPrefix(file, root, [])).toBe(false)
  })
})
