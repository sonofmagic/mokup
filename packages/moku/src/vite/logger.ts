import type { Logger } from './types'

export function createLogger(enabled: boolean): Logger {
  return {
    info: (...args: unknown[]) => {
      if (enabled) {
        // eslint-disable-next-line no-console
        console.info('[moku]', ...args)
      }
    },
    warn: (...args: unknown[]) => {
      if (enabled) {
        // eslint-disable-next-line no-console
        console.warn('[moku]', ...args)
      }
    },
    error: (...args: unknown[]) => {
      if (enabled) {
        // eslint-disable-next-line no-console
        console.error('[moku]', ...args)
      }
    },
  }
}
