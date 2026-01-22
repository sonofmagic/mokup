import type { DirInput } from './dev/utils'

export interface FetchServerOptions {
  dir?: DirInput
  prefix?: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  ignorePrefix?: string | string[]
  watch?: boolean
  log?: boolean
  playground?: boolean | { path?: string, enabled?: boolean }
  host?: string
  port?: number
  root?: string
}

export type FetchServerOptionsInput
  = | FetchServerOptions
    | FetchServerOptions[]
