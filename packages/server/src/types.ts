import type { Manifest, ModuleMap, RuntimeOptions } from '@mokup/runtime'

/**
 * Options for server adapters built on top of the runtime.
 *
 * @example
 * import type { ServerOptions } from '@mokup/server'
 *
 * const options: ServerOptions = {
 *   manifest: { version: 1, routes: [] },
 *   onNotFound: 'next',
 * }
 */
export interface ServerOptions extends RuntimeOptions {
  /**
   * Behavior when no route matches.
   *
   * @default "next"
   */
  onNotFound?: 'next' | 'response'
}

/**
 * Fetch handler signature used by server adapters.
 *
 * @example
 * import type { FetchHandler } from '@mokup/server'
 *
 * const handler: FetchHandler = async (request) => new Response('ok')
 */
export type FetchHandler = (request: Request) => Promise<Response | null>

/**
 * Bundle input for Worker helpers.
 *
 * @example
 * import type { WorkerBundle } from '@mokup/server'
 *
 * const bundle: WorkerBundle = {
 *   manifest: { version: 1, routes: [] },
 * }
 */
export interface WorkerBundle {
  /** Manifest for runtime execution. */
  manifest: Manifest
  /**
   * In-memory module map for handler execution.
   *
   * @default undefined
   */
  moduleMap?: ModuleMap | undefined
  /**
   * Base directory for module resolution.
   *
   * @default undefined
   */
  moduleBase?: string | URL | undefined
  /**
   * Behavior when no route matches.
   *
   * @default "response"
   */
  onNotFound?: 'next' | 'response'
}

/**
 * Worker input accepted by createMokupWorker.
 *
 * @example
 * import type { WorkerInput } from '@mokup/server'
 *
 * const input: WorkerInput = { version: 1, routes: [] }
 */
export type WorkerInput = Manifest | WorkerBundle
