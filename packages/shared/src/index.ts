export type DirInput = string | string[] | ((root: string) => string | string[]) | undefined

export interface MockEntryOptions {
  dir?: DirInput
  prefix?: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  ignorePrefix?: string | string[]
  watch?: boolean
  log?: boolean
}

export type PlaygroundOptionsInput = boolean | {
  path?: string
  enabled?: boolean
} | undefined
