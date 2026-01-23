import type { NodeRequestLike, NodeResponseLike } from './internal'
import type { ServerOptions } from './types'

import { createRuntime } from '@mokup/runtime'
import {
  applyRuntimeResultToNode,
  toRuntimeOptions,
  toRuntimeRequestFromNode,
} from './internal'

type NextFunction = (error?: unknown) => void

/**
 * Create a Connect-style middleware from server options.
 *
 * @param options - Server options.
 * @returns Connect middleware handler.
 *
 * @example
 * import { createConnectMiddleware } from '@mokup/server'
 *
 * const middleware = createConnectMiddleware({ manifest: { version: 1, routes: [] } })
 */
export function createConnectMiddleware(
  options: ServerOptions,
) {
  const runtime = createRuntime(toRuntimeOptions(options))
  const onNotFound = options.onNotFound ?? 'next'

  return async (
    req: NodeRequestLike,
    res: NodeResponseLike,
    next: NextFunction,
  ) => {
    const runtimeRequest = await toRuntimeRequestFromNode(req)
    const result = await runtime.handle(runtimeRequest)
    if (!result) {
      if (onNotFound === 'response') {
        res.statusCode = 404
        res.end()
        return
      }
      next()
      return
    }
    applyRuntimeResultToNode(res, result)
  }
}
