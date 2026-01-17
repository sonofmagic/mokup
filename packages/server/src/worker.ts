import type { MokupServerOptions, MokupWorkerBundle, MokupWorkerInput } from './types'

import { createFetchHandler } from './fetch'

export interface MokupWorker {
  fetch: (request: Request) => Promise<Response>
}

function isManifest(value: MokupWorkerInput): value is MokupWorkerBundle['manifest'] {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && 'version' in value
    && 'routes' in value
}

function normalizeWorkerOptions(bundle: MokupWorkerBundle): MokupServerOptions {
  const options: MokupServerOptions = {
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

function createWorker(handlerOptions: MokupServerOptions): MokupWorker {
  const handler = createFetchHandler(handlerOptions)
  return {
    fetch: async (request: Request) => {
      return (await handler(request)) ?? new Response('Not Found', { status: 404 })
    },
  }
}

export function createMokupWorker(
  input: Exclude<MokupWorkerInput, string>,
): MokupWorker {
  if (typeof input === 'string') {
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
