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

export type PlaygroundDisabledReason
  = | 'disabled'
    | 'disabled-dir'
    | 'exclude'
    | 'ignore-prefix'
    | 'include'
    | 'unknown'

export interface PlaygroundDisabledRoute {
  file: string
  reason: PlaygroundDisabledReason
  method?: string
  url?: string
  group?: string
  groupKey?: string
}

export interface PlaygroundConfigFile {
  file: string
  group?: string
  groupKey?: string
}

export type PlaygroundIgnoredReason
  = | 'unsupported'
    | 'invalid-route'
    | 'unknown'

export interface PlaygroundIgnoredRoute {
  file: string
  reason: PlaygroundIgnoredReason
  group?: string
  groupKey?: string
}

export interface PlaygroundGroup {
  key: string
  label: string
}

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

export type BodyType = 'json' | 'text' | 'form' | 'multipart' | 'base64'

export type RouteParamKind = 'param' | 'catchall' | 'optional-catchall'

export interface RouteParamField {
  id: string
  name: string
  kind: RouteParamKind
  token: string
  required: boolean
}

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

export type TreeMode = 'file' | 'route'
