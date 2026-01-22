import type { Logger } from './types'
import process from 'node:process'

let registerPromise: Promise<boolean> | null = null
let hasLoggedFailure = false

export async function ensureTsxRegister(logger?: Logger): Promise<boolean> {
  if (registerPromise) {
    return registerPromise
  }
  registerPromise = (async () => {
    try {
      const mod = await import('tsx/esm/api')
      const setSourceMapsEnabled = (process as {
        setSourceMapsEnabled?: (enabled: boolean) => void
      }).setSourceMapsEnabled
      if (typeof setSourceMapsEnabled === 'function') {
        setSourceMapsEnabled(true)
      }
      if (typeof mod.register === 'function') {
        mod.register()
      }
      return true
    }
    catch (error) {
      if (!hasLoggedFailure && logger) {
        logger.warn(
          'Failed to register tsx loader; falling back to bundled TS loader.',
          error,
        )
        hasLoggedFailure = true
      }
      return false
    }
  })()
  return registerPromise
}
