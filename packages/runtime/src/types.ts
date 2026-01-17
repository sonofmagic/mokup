import type { RouteToken } from './router'

export type HttpMethod
  = | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'OPTIONS'
    | 'HEAD'

export interface Manifest {
  version: 1
  routes: ManifestRoute[]
}

export interface ManifestRoute {
  method: HttpMethod
  url: string
  tokens?: RouteToken[]
  score?: number[]
  source?: string
  status?: number
  headers?: Record<string, string>
  delay?: number
  response: ManifestResponse
}

export type ManifestResponse
  = | {
    type: 'json'
    body: unknown
  }
  | {
    type: 'text'
    body: string
  }
  | {
    type: 'binary'
    body: string
    encoding: 'base64'
  }
  | {
    type: 'module'
    module: string
    exportName?: string
    ruleIndex?: number
  }

export interface RuntimeRequest {
  method: string
  path: string
  query: Record<string, string | string[]>
  headers: Record<string, string>
  body: unknown
  rawBody?: string
  params?: Record<string, string | string[]>
}

export interface RuntimeResult {
  status: number
  headers: Record<string, string>
  body: string | Uint8Array | null
}

export interface MockContext {
  delay: (ms: number) => Promise<void>
  json: <T>(data: T) => T
}

export interface MockResponder {
  statusCode: number
  setHeader: (key: string, value: string) => void
  getHeader: (key: string) => string | undefined
  removeHeader: (key: string) => void
}

export type MockResponseHandler = (
  req: RuntimeRequest,
  res: MockResponder,
  ctx: MockContext,
) => unknown | Promise<unknown>

export interface RuntimeOptions {
  manifest: Manifest | (() => Promise<Manifest>)
  moduleBase?: string | URL
}
