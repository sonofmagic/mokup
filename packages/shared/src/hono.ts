/**
 * Re-export the Hono API used across mokup adapters.
 *
 * @example
 * import { Hono } from '@mokup/shared/hono'
 *
 * const app = new Hono()
 */
export * from 'hono'
/**
 * Re-export the pattern router used for route matching.
 *
 * @example
 * import { PatternRouter } from '@mokup/shared/hono'
 */
export { PatternRouter } from 'hono/router/pattern-router'
/**
 * Re-export the service worker handle helper.
 *
 * @example
 * import { handle } from '@mokup/shared/hono'
 */
export { handle } from 'hono/service-worker'
