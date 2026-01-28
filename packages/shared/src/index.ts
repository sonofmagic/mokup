/**
 * Directory input for mock scanning.
 *
 * @example
 * import type { DirInput } from '@mokup/shared'
 *
 * const dir: DirInput = ['mock', 'fixtures']
 */
export type DirInput = string | string[] | ((root: string) => string | string[]) | undefined

/**
 * Shared entry options for mokup scanners and plugins.
 *
 * @example
 * import type { MockEntryOptions } from '@mokup/shared'
 *
 * const entry: MockEntryOptions = {
 *   dir: 'mock',
 *   prefix: '/api',
 *   watch: true,
 * }
 */
export interface MockEntryOptions {
  /**
   * Directory (or directories) to scan for mock routes.
   *
   * @default "mock" (resolved by Vite/webpack plugins)
   */
  dir?: DirInput
  /**
   * Request path prefix to mount mock routes under.
   *
   * @default ""
   */
  prefix?: string
  /**
   * Include filter for files to scan.
   *
   * @default undefined
   */
  include?: RegExp | RegExp[]
  /**
   * Exclude filter for files to scan.
   *
   * @default undefined
   */
  exclude?: RegExp | RegExp[]
  /**
   * Ignore file or folder prefixes when scanning.
   *
   * @default ["."]
   */
  ignorePrefix?: string | string[]
  /**
   * Enable file watching for live route updates.
   *
   * @default true
   */
  watch?: boolean
  /**
   * Enable mokup logging.
   *
   * @default true
   */
  log?: boolean
}

/**
 * Playground configuration input.
 *
 * @example
 * import type { PlaygroundOptionsInput } from '@mokup/shared'
 *
 * const playground: PlaygroundOptionsInput = {
 *   path: '/__mokup',
 *   enabled: true,
 * }
 */
export type PlaygroundOptionsInput = boolean | {
  /**
   * Base path for the playground UI.
   *
   * @default "/__mokup"
   */
  path?: string
  /**
   * Emit playground assets during production builds.
   *
   * @default false
   */
  build?: boolean
  /**
   * Enable or disable the playground routes.
   *
   * @default true
   */
  enabled?: boolean
} | undefined

export { isPromise, middlewareSymbol } from './config-core'
export {
  buildConfigChain,
  type ConfigSourceMap,
  findConfigFile,
  getConfigFileCandidates,
  type MiddlewareMeta,
  type MiddlewarePosition,
  normalizeMiddlewareList,
  readMiddlewareMeta,
  resolveDirectoryConfig,
} from './config-utils'
export {
  type ConfigApp,
  createDefineConfig,
  type DefineConfigFactory,
  type HookErrorPolicy,
  type HookHandler,
} from './define-config'
export { readJsoncFile } from './jsonc-utils'
export { loadRules } from './load-rules'
export { collectFiles, isConfigFile, isSupportedFile } from './mock-files'
export { createTsxConfigFile, ensureTsxRegister, loadModule } from './module-loader'
export {
  configExtensions,
  jsonExtensions,
  methodSet,
  methodSuffixSet,
  supportedExtensions,
} from './route-constants'
export {
  createRouteUtils,
  type DerivedRoute,
  type RouteParser,
  type RouteParserResult,
  type RouteScoreComparator,
} from './route-utils'
export {
  normalizeIgnorePrefix,
  normalizeMethod,
  normalizePrefix,
  resolveDirs,
} from './scan-utils'
