import type { Logger, LoggerOptions } from './logger-types'
import { consola } from 'consola'

const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  log: () => {},
}

export function createLogger(options: LoggerOptions | boolean = true): Logger {
  const resolvedOptions = typeof options === 'boolean' ? { enabled: options } : options
  const enabled = resolvedOptions?.enabled ?? true
  if (!enabled) {
    return silentLogger
  }
  const tag = resolvedOptions?.tag ?? 'mokup'
  const logger = consola.withTag(tag)
  return {
    info: (...args: unknown[]) => logger.info(...args),
    warn: (...args: unknown[]) => logger.warn(...args),
    error: (...args: unknown[]) => logger.error(...args),
    log: (...args: unknown[]) => logger.log(...args),
  }
}

export type { Logger, LoggerOptions }
