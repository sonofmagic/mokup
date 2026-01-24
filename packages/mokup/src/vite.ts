export { defineConfig } from './define/config'
export { defineHandler } from './define/handler'
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
} from './shared/types'

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
