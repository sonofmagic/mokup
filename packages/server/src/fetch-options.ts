import type { MockEntryOptions, PlaygroundOptionsInput } from '@mokup/shared'

export interface FetchServerOptions extends MockEntryOptions {
  host?: string
  port?: number
  root?: string
}

export interface FetchServerOptionsConfig {
  entries?: FetchServerOptions | FetchServerOptions[]
  playground?: PlaygroundOptionsInput
}

export type FetchServerOptionsInput = FetchServerOptionsConfig
