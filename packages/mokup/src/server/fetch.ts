/**
 * Re-export server runtime types for fetch-based usage.
 *
 * @example
 * import type { ServerOptions } from 'mokup/server/fetch'
 */
export type {
  FetchHandler,
  Manifest,
  ManifestRoute,
  ModuleMap,
  RuntimeOptions,
  ServerOptions,
  WorkerBundle,
  WorkerInput,
} from '@mokup/server'
/**
 * Re-export the fetch handler factory.
 *
 * @example
 * import { createFetchHandler } from 'mokup/server/fetch'
 */
export { createFetchHandler } from '@mokup/server/fetch'
