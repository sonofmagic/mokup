import type { Logger, LoggerOptions } from '@mokup/shared/logger'

const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  log: () => {},
}

/**
 * Create a console-backed logger for server dev tools.
 *
 * @param options - Logger configuration or a boolean toggle.
 * @returns Logger implementation that respects the enabled flag.
 *
 * @default
 * @default
 * @default
 *
 * @example
 * import { createLogger } from '@mokup/server'
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
  const prefix = tag ? `[${tag}]` : ''
  const withTag = (args: unknown[]) => (prefix ? [prefix, ...args] : args)
  return {
    info: (...args: unknown[]) => {
      if (args.length === 0) {
        return
      }
      console.info(...withTag(args))
    },
    warn: (...args: unknown[]) => {
      if (args.length === 0) {
        return
      }
      console.warn(...withTag(args))
    },
    error: (...args: unknown[]) => {
      if (args.length === 0) {
        return
      }
      console.error(...withTag(args))
    },
    log: (...args: unknown[]) => {
      if (args.length === 0) {
        return
      }
      console.log(...withTag(args))
    },
  }
}

/**
 * Logger type re-exports for consumers.
 *
 * @example
 * import type { Logger } from '@mokup/server'
 */
export type { Logger, LoggerOptions }
