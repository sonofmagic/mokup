/**
 * Vite plugin entry for mokup.
 *
 * @example
 * import mokup from 'mokup/vite'
 *
 * export default {
 *   plugins: [mokup({ entries: { dir: 'mock' } })],
 * }
 */
export { createMokupPlugin as default } from './vite/plugin'

export type {
  Context,
  HttpMethod,
  MiddlewareHandler,
  MokupPluginOptions,
  PlaygroundOptionsInput,
  RequestHandler,
  RouteDirectoryConfig,
  RouteResponse,
  RouteRule,
  RuntimeMode,
  ServiceWorkerOptions,
  VitePluginOptions,
  VitePluginOptionsInput,
  ViteRuntime,
} from './vite/types'
