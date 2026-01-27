import { afterEach, describe, expect, it, vi } from 'vitest'

describe('ensureTsxRegister', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('registers tsx loader and enables sourcemaps', async () => {
    const register = vi.fn()
    vi.doMock('tsx/esm/api', () => ({ register }))
    const { ensureTsxRegister } = await import('../src/dev/tsx-loader')

    const original = (process as { setSourceMapsEnabled?: (enabled: boolean) => void }).setSourceMapsEnabled
    const setSourceMapsEnabled = vi.fn()
    ;(process as { setSourceMapsEnabled?: (enabled: boolean) => void }).setSourceMapsEnabled = setSourceMapsEnabled

    const ok = await ensureTsxRegister({ warn: vi.fn() } as any)
    const cached = await ensureTsxRegister({ warn: vi.fn() } as any)

    expect(ok).toBe(true)
    expect(cached).toBe(true)
    expect(register).toHaveBeenCalledTimes(1)
    expect(setSourceMapsEnabled).toHaveBeenCalledWith(true)

    ;(process as { setSourceMapsEnabled?: (enabled: boolean) => void }).setSourceMapsEnabled = original
  })

  it('logs failures once when registration fails', async () => {
    vi.doMock('tsx/esm/api', () => {
      throw new Error('missing')
    })
    const { ensureTsxRegister } = await import('../src/dev/tsx-loader')
    const logger = { warn: vi.fn() }

    const first = await ensureTsxRegister(logger as any)
    const second = await ensureTsxRegister(logger as any)

    expect(first).toBe(false)
    expect(second).toBe(false)
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })
})
