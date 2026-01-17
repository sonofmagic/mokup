import type { MokupServerOptions } from './types'
import { createConnectMiddleware } from './connect'

export function createExpressMiddleware(
  options: MokupServerOptions,
) {
  return createConnectMiddleware(options)
}
