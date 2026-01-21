import type { ServerOptions } from './types'
import { createConnectMiddleware } from './connect'

export function createExpressMiddleware(
  options: ServerOptions,
) {
  return createConnectMiddleware(options)
}
