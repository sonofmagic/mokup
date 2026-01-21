import { describe, expect, it, vi } from 'vitest'
import { createLogger } from '../src/dev/logger'

describe('dev logger', () => {
  it('writes logs only when enabled', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const disabled = createLogger(false)
    disabled.info('skip')
    disabled.warn('skip')
    disabled.error('skip')

    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()

    const enabled = createLogger(true)
    enabled.info('ok')
    enabled.warn('warn')
    enabled.error('err')

    expect(infoSpy).toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()

    infoSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
