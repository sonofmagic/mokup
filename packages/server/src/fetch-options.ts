import type { DirInput } from './dev/utils'

export interface MokupFetchServerOptions {
  dir?: DirInput
  prefix?: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  watch?: boolean
  log?: boolean
  playground?: boolean | { path?: string, enabled?: boolean }
  host?: string
  port?: number
  root?: string
}

export type MokupFetchServerOptionsInput
  = | MokupFetchServerOptions
    | MokupFetchServerOptions[]
