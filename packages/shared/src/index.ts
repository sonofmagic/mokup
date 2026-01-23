/**
 * Directory input for mock scanning.
 *
 * @example
 * import type { DirInput } from '@mokup/shared'
 *
 * const dir: DirInput = ['mock', 'fixtures']
 */
export type DirInput = string | string[] | ((root: string) => string | string[]) | undefined

/**
 * Shared entry options for mokup scanners and plugins.
 *
 * @example
 * import type { MockEntryOptions } from '@mokup/shared'
 *
 * const entry: MockEntryOptions = {
 *   dir: 'mock',
 *   prefix: '/api',
 *   watch: true,
 * }
 */
export interface MockEntryOptions {
  /**
   * Directory (or directories) to scan for mock routes.
   *
   * @default "mock" (resolved by Vite/webpack plugins)
   */
  dir?: DirInput
  /**
   * Request path prefix to mount mock routes under.
   *
   * @default ""
   */
  prefix?: string
  /**
   * Include filter for files to scan.
   *
   * @default undefined
   */
  include?: RegExp | RegExp[]
  /**
   * Exclude filter for files to scan.
   *
   * @default undefined
   */
  exclude?: RegExp | RegExp[]
  /**
   * Ignore file or folder prefixes when scanning.
   *
   * @default ["."]
   */
  ignorePrefix?: string | string[]
  /**
   * Enable file watching for live route updates.
   *
   * @default true
   */
  watch?: boolean
  /**
   * Enable mokup logging.
   *
   * @default true
   */
  log?: boolean
}

/**
 * Playground configuration input.
 *
 * @example
 * import type { PlaygroundOptionsInput } from '@mokup/shared'
 *
 * const playground: PlaygroundOptionsInput = {
 *   path: '/__mokup',
 *   enabled: true,
 * }
 */
export type PlaygroundOptionsInput = boolean | {
  /**
   * Base path for the playground UI.
   *
   * @default "/__mokup"
   */
  path?: string
  /**
   * Enable or disable the playground routes.
   *
   * @default true
   */
  enabled?: boolean
} | undefined
