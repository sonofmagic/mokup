import { consola } from 'consola'
import { consola as browserConsola } from 'consola/browser'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLogger } from '../src/logger'
import { createLogger as createBrowserLogger } from '../src/logger.browser'

describe('shared logger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('returns a silent logger when disabled', () => {
    const logger = createLogger(false)
    expect(() => {
      logger.info('skip')
      logger.warn('skip')
      logger.error('skip')
      logger.log('skip')
    }).not.toThrow()
  })

  it('forwards messages to consola when enabled', () => {
    const info = vi.fn()
    const warn = vi.fn()
    const error = vi.fn()
    const log = vi.fn()
    const spy = vi.spyOn(consola, 'withTag').mockReturnValue({
      info,
      warn,
      error,
      log,
    } as unknown as typeof consola)

    const logger = createLogger({ tag: 'mokup' })
    logger.info('ok')
    logger.warn('warn')
    logger.error('err')
    logger.log('log')
    logger.info()

    expect(spy).toHaveBeenCalledWith('mokup')
    expect(info).toHaveBeenCalledWith('ok')
    expect(warn).toHaveBeenCalledWith('warn')
    expect(error).toHaveBeenCalledWith('err')
    expect(log).toHaveBeenCalledWith('log')
  })

  it('skips empty log calls', () => {
    const info = vi.fn()
    const warn = vi.fn()
    const error = vi.fn()
    const log = vi.fn()
    vi.spyOn(consola, 'withTag').mockReturnValue({
      info,
      warn,
      error,
      log,
    } as unknown as typeof consola)

    const logger = createLogger({ tag: 'mokup' })
    logger.info()
    logger.warn()
    logger.error()
    logger.log()

    expect(info).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
  })

  it('uses browser consola in the browser logger', () => {
    const info = vi.fn()
    const warn = vi.fn()
    const error = vi.fn()
    const log = vi.fn()
    const spy = vi.spyOn(browserConsola, 'withTag').mockReturnValue({
      info,
      warn,
      error,
      log,
    } as unknown as typeof browserConsola)

    const logger = createBrowserLogger(true)
    logger.info('browser')

    expect(spy).toHaveBeenCalledWith('mokup')
    expect(info).toHaveBeenCalledWith('browser')
  })

  it('returns a silent browser logger when disabled', () => {
    const spy = vi.spyOn(browserConsola, 'withTag')
    const logger = createBrowserLogger(false)
    logger.info('skip')
    logger.warn('skip')
    logger.error('skip')
    logger.log('skip')

    expect(spy).not.toHaveBeenCalled()
  })

  it('skips empty browser log calls', () => {
    const info = vi.fn()
    const warn = vi.fn()
    const error = vi.fn()
    const log = vi.fn()
    vi.spyOn(browserConsola, 'withTag').mockReturnValue({
      info,
      warn,
      error,
      log,
    } as unknown as typeof browserConsola)

    const logger = createBrowserLogger(true)
    logger.info()
    logger.warn()
    logger.error()
    logger.log()

    expect(info).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
  })

  it('forwards browser log args', () => {
    const info = vi.fn()
    const warn = vi.fn()
    const error = vi.fn()
    const log = vi.fn()
    vi.spyOn(browserConsola, 'withTag').mockReturnValue({
      info,
      warn,
      error,
      log,
    } as unknown as typeof browserConsola)

    const logger = createBrowserLogger({ tag: 'mokup' })
    logger.warn('warn', { extra: true })
    logger.error('err')
    logger.log('log', 1)

    expect(warn).toHaveBeenCalledWith('warn', { extra: true })
    expect(error).toHaveBeenCalledWith('err')
    expect(log).toHaveBeenCalledWith('log', 1)
  })
})
