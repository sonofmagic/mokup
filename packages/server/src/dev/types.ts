import type { RouteToken } from '@mokup/runtime'
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
