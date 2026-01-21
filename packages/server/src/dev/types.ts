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

export type RequestHandler = (
  context: Context,
) => Response | Promise<Response> | unknown

export type RouteResponse = unknown | RequestHandler

export interface RouteRule {
  handler: RouteResponse
  status?: number
  headers?: Record<string, string>
  delay?: number
}

export interface RouteDirectoryConfig {
  headers?: Record<string, string>
  status?: number
  delay?: number
  enabled?: boolean
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
