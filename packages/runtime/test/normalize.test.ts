import { describe, expect, it, vi } from 'vitest'
import { delay, mergeHeaders, normalizeMethod } from '../src/normalize'

describe('normalize helpers', () => {
  it('normalizes methods and merges headers', () => {
    expect(normalizeMethod('get')).toBe('GET')
    expect(normalizeMethod('HEAD')).toBe('HEAD')
    expect(normalizeMethod('INVALID')).toBeUndefined()

    expect(mergeHeaders({ a: '1' }, { b: '2' })).toEqual({ a: '1', b: '2' })
    expect(mergeHeaders({ a: '1' }, undefined)).toEqual({ a: '1' })
  })

  it('delays with timers', async () => {
    vi.useFakeTimers()
    const spy = vi.fn()
    delay(25).then(spy)
    await vi.advanceTimersByTimeAsync(24)
    expect(spy).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(spy).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
