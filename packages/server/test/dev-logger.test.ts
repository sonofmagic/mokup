import { describe, expect, it, vi } from 'vitest'
import { createLogger } from '../src/dev/logger'

describe('dev logger', () => {
  it('returns silent logger when disabled', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logger = createLogger(false)
    logger.info('hello')
    expect(info).not.toHaveBeenCalled()
    info.mockRestore()
  })

  it('prefixes log output with tag', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const logger = createLogger({ tag: 'mokup' })
    logger.info('ready')
    logger.warn('warn')

    expect(info).toHaveBeenCalledWith('[mokup]', 'ready')
    expect(warn).toHaveBeenCalledWith('[mokup]', 'warn')
    info.mockRestore()
    warn.mockRestore()
  })

  it('skips empty log calls', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const logger = createLogger(true)
    logger.error()
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it('logs without a tag when tag is empty', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const logger = createLogger({ tag: '' })
    logger.log('ok')
    logger.error('boom')

    expect(log).toHaveBeenCalledWith('ok')
    expect(error).toHaveBeenCalledWith('boom')
    log.mockRestore()
    error.mockRestore()
  })

  it('defaults to mokup tag and skips empty args', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const logger = createLogger()
    logger.info()
    logger.warn()
    logger.info('ready')
    expect(info).toHaveBeenCalledWith('[mokup]', 'ready')
    expect(warn).not.toHaveBeenCalled()
    info.mockRestore()
    warn.mockRestore()
  })
})
