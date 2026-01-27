import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  createDebouncer,
  delay,
  hasIgnoredPrefix,
  isInDirs,
  matchesFilter,
  normalizeIgnorePrefix,
  normalizeMethod,
  normalizePrefix,
  resolveDirs,
  toPosix,
} from '../src/shared/utils'

describe('vite utils', () => {
  it('normalizes HTTP methods and prefixes', () => {
    expect(normalizeMethod('get')).toBe('GET')
    expect(normalizeMethod('PATCH')).toBe('PATCH')
    expect(normalizeMethod('unknown')).toBeUndefined()
    expect(normalizeMethod(undefined)).toBeUndefined()

    expect(normalizePrefix('')).toBe('')
    expect(normalizePrefix('api')).toBe('/api')
    expect(normalizePrefix('/api/')).toBe('/api')
  })

  it('resolves directories with defaults and de-duplicates', () => {
    const posixPath = path.posix
    const root = posixPath.join('/tmp', 'mokup')
    expect(resolveDirs(undefined, root)).toEqual([posixPath.join(root, 'mock')])

    const resolved = resolveDirs(
      () => ['mock', posixPath.join(root, 'mock'), 'mock'],
      root,
    )
    expect(resolved).toEqual([posixPath.join(root, 'mock')])
  })

  it('debounces calls', async () => {
    vi.useFakeTimers()
    const spy = vi.fn()
    const debounced = createDebouncer(50, spy)
    debounced()
    debounced()
    await vi.advanceTimersByTimeAsync(49)
    expect(spy).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(spy).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('checks directory membership and filters', () => {
    const posixPath = path.posix
    const dirs = [posixPath.join('/tmp', 'mokup', 'mock')]
    expect(isInDirs(posixPath.join('/tmp', 'mokup', 'mock', 'users.ts'), dirs)).toBe(true)
    expect(isInDirs(posixPath.join('/tmp', 'mokup', 'other', 'users.ts'), dirs)).toBe(false)

    expect(matchesFilter('/src/index.ts', /src/)).toBe(true)
    expect(matchesFilter('/src/index.ts', /foo/)).toBe(false)
    expect(matchesFilter('/src/index.ts', /src/, /index/)).toBe(false)
    expect(matchesFilter('/src/index.ts')).toBe(true)
  })

  it('compares Windows paths without case sensitivity', () => {
    const root = String.raw`C:\Repo\Mock`
    const file = String.raw`c:\repo\mock\Users.ts`
    const ignored = String.raw`C:\Repo\Mock\.draft\users.get.json`

    expect(isInDirs(file, [root])).toBe(true)
    expect(matchesFilter(file, /mock/)).toBe(true)
    expect(hasIgnoredPrefix(ignored, root, ['.'])).toBe(true)
  })

  it('normalizes ignore prefixes and checks segments', () => {
    const root = path.posix.join('/tmp', 'mokup', 'mock')
    const file = path.posix.join(root, '.draft', 'users.get.json')
    expect(normalizeIgnorePrefix(undefined)).toEqual(['.'])
    expect(normalizeIgnorePrefix('_')).toEqual(['_'])
    expect(hasIgnoredPrefix(file, root, normalizeIgnorePrefix(undefined))).toBe(true)
    expect(hasIgnoredPrefix(file, root, normalizeIgnorePrefix('_'))).toBe(false)
    expect(hasIgnoredPrefix(file, root, [])).toBe(false)
  })

  it('normalizes to posix paths', () => {
    expect(toPosix('mock\\routes\\index.ts')).toBe('mock/routes/index.ts')
  })

  it('delays by the requested duration', async () => {
    vi.useFakeTimers()
    const spy = vi.fn()
    delay(20).then(spy)
    await vi.advanceTimersByTimeAsync(19)
    expect(spy).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(spy).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
