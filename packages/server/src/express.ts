import type { ServerOptions } from './types'
import { createConnectMiddleware } from './connect'

/**
 * Create an Express middleware from server options.
 *
 * @param options - Server options.
 * @returns Express middleware handler.
 *
 * @example
 * import { createExpressMiddleware } from '@mokup/server'
 *
 * const middleware = createExpressMiddleware({ manifest: { version: 1, routes: [] } })
 */
export function createExpressMiddleware(
  options: ServerOptions,
) {
  return createConnectMiddleware(options)
}
