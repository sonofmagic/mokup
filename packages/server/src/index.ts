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
