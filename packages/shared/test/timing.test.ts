import { describe, expect, it, vi } from 'vitest'
import { createDebouncer, delay } from '../src/timing'

describe('timing helpers', () => {
  it('debounces calls', async () => {
    vi.useFakeTimers()
    const spy = vi.fn()
    const debounced = createDebouncer(40, spy)
    debounced()
    debounced()
    await vi.advanceTimersByTimeAsync(39)
    expect(spy).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(spy).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('resolves delay after the requested duration', async () => {
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
