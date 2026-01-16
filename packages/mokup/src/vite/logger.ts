import type { Logger } from './types'

export function createLogger(enabled: boolean): Logger {
  return {
    info: (...args: unknown[]) => {
      if (enabled) {
        // eslint-disable-next-line no-console
        console.info('[mokup]', ...args)
      }
    },
    warn: (...args: unknown[]) => {
      if (enabled) {
        // eslint-disable-next-line no-console
        console.warn('[mokup]', ...args)
      }
    },
    error: (...args: unknown[]) => {
      if (enabled) {
        // eslint-disable-next-line no-console
        console.error('[mokup]', ...args)
      }
    },
  }
}
