/**
 * Route metadata displayed in the playground UI.
 *
 * @example
 * import type { PlaygroundRoute } from '@mokup/playground'
 *
 * const route: PlaygroundRoute = {
 *   method: 'GET',
 *   url: '/api/ping',
 *   file: 'mock/ping.get.ts',
 *   type: 'handler',
 * }
 */
export interface PlaygroundRoute {
  method: string
  url: string
  file: string
  type: 'handler' | 'static'
  group?: string
  groupKey?: string
  status?: number
  delay?: number
  middlewareCount?: number
  middlewares?: string[]
}

/**
 * Reasons a route was disabled.
 *
 * @example
 * import type { PlaygroundDisabledReason } from '@mokup/playground'
 *
 * const reason: PlaygroundDisabledReason = 'disabled'
 */
export type PlaygroundDisabledReason
  = | 'disabled'
    | 'disabled-dir'
    | 'exclude'
    | 'ignore-prefix'
    | 'include'
    | 'unknown'

/**
 * Disabled route metadata.
 *
 * @example
 * import type { PlaygroundDisabledRoute } from '@mokup/playground'
 *
 * const disabled: PlaygroundDisabledRoute = {
 *   file: 'mock/disabled.get.ts',
 *   reason: 'disabled',
 * }
 */
export interface PlaygroundDisabledRoute {
  file: string
  reason: PlaygroundDisabledReason
  method?: string
  url?: string
  group?: string
  groupKey?: string
}

/**
 * Config file metadata for the playground view.
 *
 * @example
 * import type { PlaygroundConfigFile } from '@mokup/playground'
 *
 * const config: PlaygroundConfigFile = { file: 'mock/index.config.ts' }
 */
export interface PlaygroundConfigFile {
  file: string
  group?: string
  groupKey?: string
}

/**
 * Reasons a file was ignored in scanning.
 *
 * @example
 * import type { PlaygroundIgnoredReason } from '@mokup/playground'
 *
 * const reason: PlaygroundIgnoredReason = 'unsupported'
 */
export type PlaygroundIgnoredReason
  = | 'unsupported'
    | 'invalid-route'
    | 'unknown'

/**
 * Ignored file metadata.
 *
 * @example
 * import type { PlaygroundIgnoredRoute } from '@mokup/playground'
 *
 * const ignored: PlaygroundIgnoredRoute = { file: 'mock/notes.txt', reason: 'unsupported' }
 */
export interface PlaygroundIgnoredRoute {
  file: string
  reason: PlaygroundIgnoredReason
  group?: string
  groupKey?: string
}

/**
 * Grouping metadata for route lists.
 *
 * @example
 * import type { PlaygroundGroup } from '@mokup/playground'
 *
 * const group: PlaygroundGroup = { key: 'mock', label: 'Mock' }
 */
export interface PlaygroundGroup {
  key: string
  label: string
}

/**
 * Response payload served by the playground routes endpoint.
 *
 * @example
 * import type { PlaygroundResponse } from '@mokup/playground'
 *
 * const response: PlaygroundResponse = {
 *   basePath: '/__mokup',
 *   count: 0,
 *   routes: [],
 * }
 */
export interface PlaygroundResponse {
  basePath: string
  root?: string
  count: number
  groups?: PlaygroundGroup[]
  routes: PlaygroundRoute[]
  disabled?: PlaygroundDisabledRoute[]
  ignored?: PlaygroundIgnoredRoute[]
  configs?: PlaygroundConfigFile[]
  disabledConfigs?: PlaygroundConfigFile[]
}

/**
 * Body input modes supported by the playground UI.
 *
 * @example
 * import type { BodyType } from '@mokup/playground'
 *
 * const mode: BodyType = 'json'
 */
export type BodyType = 'json' | 'text' | 'form' | 'multipart' | 'base64'

/**
 * Supported route param kinds.
 *
 * @example
 * import type { RouteParamKind } from '@mokup/playground'
 *
 * const kind: RouteParamKind = 'param'
 */
export type RouteParamKind = 'param' | 'catchall' | 'optional-catchall'

/**
 * Route parameter metadata for request inputs.
 *
 * @example
 * import type { RouteParamField } from '@mokup/playground'
 *
 * const field: RouteParamField = {
 *   id: 'id',
 *   name: 'id',
 *   kind: 'param',
 *   token: '[id]',
 *   required: true,
 * }
 */
export interface RouteParamField {
  id: string
  name: string
  kind: RouteParamKind
  token: string
  required: boolean
}

/**
 * Row model for the route tree view.
 *
 * @example
 * import type { TreeRow } from '@mokup/playground'
 *
 * const row: TreeRow = { id: '1', label: 'users', kind: 'folder', depth: 0 }
 */
export interface TreeRow {
  id: string
  label: string
  kind: 'folder' | 'route'
  depth: number
  title?: string
  expanded?: boolean
  selected?: boolean
  route?: PlaygroundRoute
}

/**
 * Tree view mode for the playground sidebar.
 *
 * @example
 * import type { TreeMode } from '@mokup/playground'
 *
 * const mode: TreeMode = 'file'
 */
export type TreeMode = 'file' | 'route'
