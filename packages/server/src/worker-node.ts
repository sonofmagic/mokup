import type { ModuleMap } from '@mokup/runtime'

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

async function loadBundleFromDir(dir: string): Promise<MokupWorkerBundle> {
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
  const manifest = JSON.parse(manifestRaw) as MokupWorkerBundle['manifest']

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

  const bundle: MokupWorkerBundle = {
    manifest,
    moduleBase: join(dir, '/'),
  }
  if (typeof moduleMap !== 'undefined') {
    bundle.moduleMap = moduleMap
  }
  return bundle
}

function createWorker(handlerOptions: MokupServerOptions): MokupWorker {
  const handler = createFetchHandler(handlerOptions)
  return {
    fetch: async (request: Request) => {
      return (await handler(request)) ?? new Response('Not Found', { status: 404 })
    },
  }
}

export function createMokupWorker(input: string): Promise<MokupWorker>
export function createMokupWorker(
  input: Exclude<MokupWorkerInput, string>,
): MokupWorker
export function createMokupWorker(
  input: MokupWorkerInput,
): MokupWorker | Promise<MokupWorker> {
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
