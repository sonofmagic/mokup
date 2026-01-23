/**
 * Minimal logger contract used by mokup packages.
 *
 * @example
 * import type { Logger } from '@mokup/shared/logger'
 *
 * const logger: Logger = {
 *   info: console.log,
 *   warn: console.warn,
 *   error: console.error,
 * }
 */
export interface Logger {
  /** Log an informational message. */
  info: (...args: unknown[]) => void
  /** Log a warning message. */
  warn: (...args: unknown[]) => void
  /** Log an error message. */
  error: (...args: unknown[]) => void
  /** Log a generic message (optional). */
  log?: (...args: unknown[]) => void
}

/**
 * Options for creating a tagged logger.
 *
 * @example
 * import type { LoggerOptions } from '@mokup/shared/logger'
 *
 * const options: LoggerOptions = {
 *   enabled: true,
 *   tag: 'mokup',
 * }
 */
export interface LoggerOptions {
  /**
   * Enable or disable logging.
   *
   * @default true
   */
  enabled?: boolean
  /**
   * Tag prefix attached to each log line.
   *
   * @default "mokup"
   */
  tag?: string
}
