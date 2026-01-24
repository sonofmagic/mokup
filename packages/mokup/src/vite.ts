export { defineConfig } from './vite/define-config'
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
  MiddlewarePosition,
  MiddlewareRegistry,
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
