import type { MokupPluginOptions } from './shared/types'

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
 * Webpack plugin options (alias of MokupPluginOptions).
 *
 * @example
 * import type { WebpackPluginOptions } from 'mokup/webpack'
 *
 * const options: WebpackPluginOptions = { entries: { dir: 'mock' } }
 */
export type WebpackPluginOptions = MokupPluginOptions

/**
 * Webpack plugin options input (alias of MokupPluginOptions).
 *
 * @example
 * import type { WebpackPluginOptionsInput } from 'mokup/webpack'
 *
 * const options: WebpackPluginOptionsInput = { entries: { dir: 'mock' } }
 */
export type WebpackPluginOptionsInput = MokupPluginOptions

/**
 * Create the mokup webpack plugin.
 *
 * @example
 * import { createMokupWebpackPlugin } from 'mokup/webpack'
 */
export { createMokupWebpackPlugin } from './webpack/plugin'
