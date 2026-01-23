import type { Logger, LoggerOptions } from './logger-types'
import { consola } from 'consola/browser'

const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  log: () => {},
}

/**
 * Create a tagged logger backed by consola for the browser.
 *
 * @param options - Logger configuration or a boolean toggle.
 * @returns A logger implementation that respects the enabled flag.
 *
 * @default
 * @default
 * @default
 *
 * @example
 * import { createLogger } from '@mokup/shared/logger.browser'
 *
 * const logger = createLogger({ tag: 'mokup' })
 * logger.info('ready')
 */
export function createLogger(options: LoggerOptions | boolean = true): Logger {
  const resolvedOptions = typeof options === 'boolean' ? { enabled: options } : options
  const enabled = resolvedOptions?.enabled ?? true
  if (!enabled) {
    return silentLogger
  }
  const tag = resolvedOptions?.tag ?? 'mokup'
  const logger = consola.withTag(tag)
  return {
    info: (...args: unknown[]) => {
      if (args.length === 0) {
        return
      }
      const [first, ...rest] = args
      logger.info(first as any, ...(rest as any[]))
    },
    warn: (...args: unknown[]) => {
      if (args.length === 0) {
        return
      }
      const [first, ...rest] = args
      logger.warn(first as any, ...(rest as any[]))
    },
    error: (...args: unknown[]) => {
      if (args.length === 0) {
        return
      }
      const [first, ...rest] = args
      logger.error(first as any, ...(rest as any[]))
    },
    log: (...args: unknown[]) => {
      if (args.length === 0) {
        return
      }
      const [first, ...rest] = args
      logger.log(first as any, ...(rest as any[]))
    },
  }
}

/**
 * Logger type re-exports for consumers.
 *
 * @example
 * import type { Logger } from '@mokup/shared/logger.browser'
 */
export type { Logger, LoggerOptions }
