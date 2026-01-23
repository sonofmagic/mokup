import type { ServerOptions, WorkerBundle, WorkerInput } from './types'

import { createFetchHandler } from './fetch'

/**
 * Minimal Worker-style fetch interface.
 *
 * @example
 * import type { FetchWorker } from '@mokup/server/worker'
 *
 * const worker: FetchWorker = {
 *   fetch: async () => new Response('ok'),
 * }
 */
export interface FetchWorker {
  /** Fetch handler for the Worker runtime. */
  fetch: (request: Request) => Promise<Response>
}

function isStringInput(value: unknown): value is string {
  return typeof value === 'string'
}

function isManifest(value: WorkerInput): value is WorkerBundle['manifest'] {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && 'version' in value
    && 'routes' in value
}

function normalizeWorkerOptions(bundle: WorkerBundle): ServerOptions {
  const options: ServerOptions = {
    manifest: bundle.manifest,
    onNotFound: bundle.onNotFound ?? 'response',
  }
  if (typeof bundle.moduleBase !== 'undefined') {
    options.moduleBase = bundle.moduleBase
  }
  if (typeof bundle.moduleMap !== 'undefined') {
    options.moduleMap = bundle.moduleMap
  }
  return options
}

function createWorker(handlerOptions: ServerOptions): FetchWorker {
  const handler = createFetchHandler(handlerOptions)
  return {
    fetch: async (request: Request) => {
      return (await handler(request)) ?? new Response('Not Found', { status: 404 })
    },
  }
}

/**
 * Create a Worker-compatible fetch handler from a manifest or bundle.
 *
 * @param input - Manifest or bundle input.
 * @returns Worker fetch handler.
 *
 * @example
 * import { createMokupWorker } from '@mokup/server/worker'
 *
 * const worker = createMokupWorker({ version: 1, routes: [] })
 */
export function createMokupWorker(
  input: WorkerInput,
): FetchWorker {
  if (isStringInput(input)) {
    throw new TypeError('createMokupWorker(dir) is only supported in Node runtimes.')
  }
  if (isManifest(input)) {
    return createWorker({
      manifest: input,
      onNotFound: 'response',
    })
  }
  return createWorker(normalizeWorkerOptions(input))
}
