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
} from './vite/types'

/**
 * Create the mokup webpack plugin.
 *
 * @example
 * import { createMokupWebpackPlugin } from 'mokup/webpack'
 */
export { createMokupWebpackPlugin } from './webpack/plugin'
