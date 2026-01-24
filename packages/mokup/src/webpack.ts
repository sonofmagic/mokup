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
} from './shared/types'

/**
 * Create the mokup webpack plugin.
 *
 * @example
 * import { createMokupWebpackPlugin } from 'mokup/webpack'
 */
export { createMokupWebpackPlugin } from './webpack/plugin'
