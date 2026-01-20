import type { Context, MiddlewareHandler } from '@mokup/shared/hono'
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
  middleware?: ManifestModuleRef[]
  response: ManifestResponse
}

export interface ManifestModuleRef {
  module: string
  exportName?: string
  ruleIndex?: number
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
  | ({ type: 'module' } & ManifestModuleRef)

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

export type MockContext = Context

export type MockMiddleware = MiddlewareHandler

export type MockResponseHandler = (
  context: Context,
) => Response | Promise<Response> | unknown

export interface RuntimeOptions {
  manifest: Manifest | (() => Promise<Manifest>)
  moduleBase?: string | URL
  moduleMap?: ModuleMap
}

export type ModuleMap = Record<string, Record<string, unknown>>
