import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  hasIgnoredPrefix,
  isInDirs,
  matchesFilter,
  normalizePathForComparison,
  toPosix,
} from '../src/path-utils'

describe('path utils', () => {
  it('normalizes separators and comparison casing', () => {
    expect(toPosix('mock\\routes\\index.ts')).toBe('mock/routes/index.ts')
    expect(normalizePathForComparison(String.raw`C:\Repo\Mock\File.ts`)).toBe('c:/repo/mock/file.ts')
    expect(normalizePathForComparison('/tmp/mock/File.ts')).toBe('/tmp/mock/File.ts')
  })

  it('checks directory membership and filters', () => {
    const posixPath = path.posix
    const root = posixPath.join('/tmp', 'mokup')
    const dirs = [posixPath.join(root, 'mock')]
    expect(isInDirs(posixPath.join(root, 'mock', 'users.ts'), dirs)).toBe(true)
    expect(isInDirs(posixPath.join(root, 'other', 'users.ts'), dirs)).toBe(false)

    const file = posixPath.join(root, 'mock', 'users.json')
    expect(matchesFilter(file, /users/)).toBe(true)
    expect(matchesFilter(file, /posts/)).toBe(false)
    expect(matchesFilter(file, /users/, /users/)).toBe(false)
  })

  it('matches Windows-style paths without case sensitivity', () => {
    const root = String.raw`C:\Repo\Mock`
    const file = String.raw`c:\repo\mock\users.json`
    expect(isInDirs(file, [root])).toBe(true)
    expect(matchesFilter(file, /mock/)).toBe(true)
  })

  it('detects ignored prefixes inside paths', () => {
    const root = path.posix.join('/tmp', 'mokup', 'mock')
    const file = path.posix.join(root, '.draft', 'users.get.json')
    expect(hasIgnoredPrefix(file, root, ['.'])).toBe(true)
    expect(hasIgnoredPrefix(file, root, ['_'])).toBe(false)
    expect(hasIgnoredPrefix(file, root, [])).toBe(false)
  })
})
