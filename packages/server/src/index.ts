/**
 * Directory config helper for dev scans.
 *
 * @example
 * import { defineConfig } from '@mokup/server'
 */
export { defineConfig, onAfterAll, onBeforeAll } from './dev/define-config'
/**
 * Dev config and middleware types.
 *
 * @example
 * import type { RouteDirectoryConfig } from '@mokup/server'
 */
export type {
  HookErrorPolicy,
  MiddlewareHandler,
  MiddlewarePosition,
  MiddlewareRegistry,
  ResolvedMiddleware,
  RouteDirectoryConfig,
  RouteRule,
} from './dev/types'
/**
 * Fetch handler factory.
 *
 * @example
 * import { createFetchHandler } from '@mokup/server'
 */
export { createFetchHandler } from './fetch'
/**
 * Core server types.
 *
 * @example
 * import type { ServerOptions } from '@mokup/server'
 */
export type {
  FetchHandler,
  ServerOptions,
  WorkerBundle,
  WorkerInput,
} from './types'
/**
 * Worker helper for runtime-agnostic fetch handlers.
 *
 * @example
 * import { createMokupWorker } from '@mokup/server'
 */
export { createMokupWorker } from './worker'
/**
 * Runtime types re-exported for convenience.
 *
 * @example
 * import type { Manifest } from '@mokup/server'
 */
export type {
  Manifest,
  ManifestRoute,
  ModuleMap,
  RuntimeOptions,
} from '@mokup/runtime'
