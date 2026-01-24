import type { RequestHandler, RouteRule } from '../shared/types'

/**
 * Define a mock route handler with type hints.
 *
 * @param input - Handler function or rule object.
 * @returns The same handler or rule.
 *
 * @example
 * import { defineHandler } from 'mokup'
 *
 * export default defineHandler((c) => {
 *   return { ok: true }
 * })
 *
 * @example
 * import { defineHandler } from 'mokup'
 *
 * export default defineHandler({
 *   enabled: false,
 *   handler: async (c) => {
 *     return { ok: false, method: c.req.method }
 *   },
 * })
 */
export function defineHandler(input: RequestHandler): RequestHandler
export function defineHandler(input: RouteRule): RouteRule
export function defineHandler(input: RequestHandler | RouteRule) {
  return input
}
