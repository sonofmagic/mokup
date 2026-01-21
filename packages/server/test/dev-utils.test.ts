import { describe, expect, it, vi } from 'vitest'
import {
  createDebouncer,
  delay,
  isInDirs,
  matchesFilter,
  normalizeMethod,
  normalizePrefix,
  resolveDirs,
  toPosix,
} from '../src/dev/utils'

describe('server dev utils', () => {
  it('normalizes methods, prefixes, and resolves dirs', () => {
    expect(normalizeMethod('get')).toBe('GET')
    expect(normalizeMethod('INVALID')).toBeUndefined()
    expect(normalizePrefix('api/')).toBe('/api')
    expect(normalizePrefix('')).toBe('')

    const resolved = resolveDirs(root => [root, 'mock', root], '/tmp/mokup')
    expect(resolved).toEqual(['/tmp/mokup', '/tmp/mokup/mock'])
  })

  it('handles path normalization and dir checks', () => {
    expect(toPosix('a\\b\\c')).toBe('a/b/c')
    expect(isInDirs('/tmp/mock/users.json', ['/tmp/mock'])).toBe(true)
    expect(isInDirs('/tmp/mock', ['/tmp/mock/'])).toBe(true)
    expect(isInDirs('/tmp/other/users.json', ['/tmp/mock'])).toBe(false)

    expect(matchesFilter('/tmp/mock/users.json', /users/)).toBe(true)
    expect(matchesFilter('/tmp/mock/users.json', /posts/)).toBe(false)
    expect(matchesFilter('/tmp/mock/users.json', /users/, /users/)).toBe(false)
  })

  it('debounces and delays using timers', async () => {
    vi.useFakeTimers()
    const spy = vi.fn()
    const debounce = createDebouncer(20, spy)
    debounce()
    debounce()
    await vi.advanceTimersByTimeAsync(19)
    expect(spy).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(spy).toHaveBeenCalledTimes(1)

    const delaySpy = vi.fn()
    delay(10).then(delaySpy)
    await vi.advanceTimersByTimeAsync(9)
    expect(delaySpy).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(delaySpy).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
