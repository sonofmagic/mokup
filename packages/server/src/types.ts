import type { Manifest, ModuleMap, RuntimeOptions } from '@mokup/runtime'

export interface MokupServerOptions extends RuntimeOptions {
  onNotFound?: 'next' | 'response'
}

export type FetchHandler = (request: Request) => Promise<Response | null>

export interface MokupWorkerBundle {
  manifest: Manifest
  moduleMap?: ModuleMap
  moduleBase?: string | URL
  onNotFound?: 'next' | 'response'
}

export type MokupWorkerInput = string | Manifest | MokupWorkerBundle
