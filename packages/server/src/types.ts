import type { Manifest, ModuleMap, RuntimeOptions } from '@mokup/runtime'

export interface ServerOptions extends RuntimeOptions {
  onNotFound?: 'next' | 'response'
}

export type FetchHandler = (request: Request) => Promise<Response | null>

export interface WorkerBundle {
  manifest: Manifest
  moduleMap?: ModuleMap
  moduleBase?: string | URL
  onNotFound?: 'next' | 'response'
}

export type WorkerInput = string | Manifest | WorkerBundle
