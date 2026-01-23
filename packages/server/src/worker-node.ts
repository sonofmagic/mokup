import type { ModuleMap } from '@mokup/runtime'

import type { ServerOptions, WorkerBundle, WorkerInput } from './types'

import { createFetchHandler } from './fetch'

/**
 * Minimal Worker-style fetch interface for Node helpers.
 *
 * @example
 * import type { FetchWorker } from '@mokup/server/node'
 *
 * const worker: FetchWorker = { fetch: async () => new Response('ok') }
 */
export interface FetchWorker {
  /** Fetch handler for the Worker runtime. */
  fetch: (request: Request) => Promise<Response>
}

/**
 * Input accepted by the Node worker helper.
 *
 * @example
 * import type { NodeWorkerInput } from '@mokup/server/node'
 *
 * const input: NodeWorkerInput = '.mokup'
 */
export type NodeWorkerInput = string | WorkerInput

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

async function loadBundleFromDir(dir: string): Promise<WorkerBundle> {
  const nodeProcess = await import('node:process')
  const isNode = typeof nodeProcess !== 'undefined' && !!nodeProcess.versions?.node
  if (!isNode) {
    throw new TypeError('createMokupWorker(dir) is only supported in Node runtimes.')
  }

  const { readFile, access } = await import('node:fs/promises')
  const { resolve, join } = await import('node:path')
  const { pathToFileURL } = await import('node:url')

  const manifestPath = resolve(dir, 'mokup.manifest.json')
  const manifestRaw = await readFile(manifestPath, 'utf8')
  const manifest = JSON.parse(manifestRaw) as WorkerBundle['manifest']

  const handlersIndexPath = resolve(dir, 'mokup-handlers', 'index.mjs')
  let moduleMap: ModuleMap | undefined
  try {
    await access(handlersIndexPath)
    const module = await import(pathToFileURL(handlersIndexPath).href)
    moduleMap = (module as { mokupModuleMap?: ModuleMap }).mokupModuleMap
  }
  catch {
    moduleMap = undefined
  }

  const bundle: WorkerBundle = {
    manifest,
    moduleBase: join(dir, '/'),
  }
  if (typeof moduleMap !== 'undefined') {
    bundle.moduleMap = moduleMap
  }
  return bundle
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
 * Create a Worker-compatible fetch handler for Node.
 *
 * @param input - Directory path, manifest, or bundle.
 * @returns Worker handler or a promise when input is a directory.
 *
 * @example
 * import { createMokupWorker } from '@mokup/server/node'
 *
 * const worker = await createMokupWorker('.mokup')
 */
export function createMokupWorker(input: string): Promise<FetchWorker>
export function createMokupWorker(input: WorkerInput): FetchWorker
export function createMokupWorker(
  input: NodeWorkerInput,
): FetchWorker | Promise<FetchWorker> {
  if (typeof input === 'string') {
    return loadBundleFromDir(input)
      .then(bundle => createWorker(normalizeWorkerOptions(bundle)))
  }
  if (isManifest(input)) {
    return createWorker({
      manifest: input,
      onNotFound: 'response',
    })
  }
  return createWorker(normalizeWorkerOptions(input))
}
