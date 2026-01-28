import type { Logger } from './types'

import { ensureTsxRegister as ensureTsxRegisterShared } from '@mokup/shared/module-loader'

let hasLoggedFailure = false

export async function ensureTsxRegister(logger?: Logger): Promise<boolean> {
  try {
    await ensureTsxRegisterShared()
    return true
  }
  catch (error) {
    if (!hasLoggedFailure && logger) {
      logger.warn('Failed to register tsx loader.', error)
      hasLoggedFailure = true
    }
    return false
  }
}
