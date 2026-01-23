import type { RouteToken } from '@mokup/runtime'
import type { MockEntryOptions, PlaygroundOptionsInput } from '@mokup/shared'
import type { Context, MiddlewareHandler } from '@mokup/shared/hono'

export type HttpMethod
  = | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'OPTIONS'
    | 'HEAD'

export type RouteStaticResponse
  = | string
    | number
    | boolean
    | bigint
    | symbol
    | null
    | undefined
    | object

export type RouteHandlerResult = RouteStaticResponse | Response

export type RequestHandler = (
  context: Context,
) => RouteHandlerResult | Promise<RouteHandlerResult>

export type RouteResponse = RouteStaticResponse | RequestHandler

export interface RouteRule {
  handler: RouteResponse
  enabled?: boolean
  status?: number
  headers?: Record<string, string>
  delay?: number
}

export type RuntimeMode = 'server' | 'sw'
export type ViteRuntime = 'vite' | 'worker'

export interface ServiceWorkerOptions {
  path?: string
  scope?: string
  register?: boolean
  unregister?: boolean
  fallback?: boolean
  basePath?: string | string[]
}

export type { DirInput, MockEntryOptions, PlaygroundOptionsInput } from '@mokup/shared'

export interface RouteDirectoryConfig {
  headers?: Record<string, string>
  status?: number
  delay?: number
  enabled?: boolean
  ignorePrefix?: string | string[]
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  middleware?: MiddlewareHandler | MiddlewareHandler[]
}

export interface ResolvedMiddleware {
  handle: MiddlewareHandler
  source: string
  index: number
}

export interface VitePluginOptions extends MockEntryOptions {
  mode?: RuntimeMode
  sw?: ServiceWorkerOptions
}

export interface MokupPluginOptions {
  entries?: VitePluginOptions | VitePluginOptions[]
  playground?: PlaygroundOptionsInput
  runtime?: ViteRuntime
}

export type VitePluginOptionsInput = MokupPluginOptions

export interface ResolvedRoute {
  file: string
  template: string
  method: HttpMethod
  tokens: RouteToken[]
  score: number[]
  handler: RouteResponse
  middlewares?: ResolvedMiddleware[]
  status?: number
  headers?: Record<string, string>
  delay?: number
  ruleIndex?: number
}

export type RouteTable = ResolvedRoute[]

export interface Logger {
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

export type { Context, MiddlewareHandler } from '@mokup/shared/hono'
