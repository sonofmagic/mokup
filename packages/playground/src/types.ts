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
