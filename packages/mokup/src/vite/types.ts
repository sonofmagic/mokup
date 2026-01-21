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

export type RuntimeMode = 'server' | 'sw'

export interface ServiceWorkerOptions {
  path?: string
  scope?: string
  register?: boolean
  unregister?: boolean
  fallback?: boolean
  basePath?: string | string[]
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

export interface VitePluginOptions {
  dir?: string | string[] | ((root: string) => string | string[])
  prefix?: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  watch?: boolean
  log?: boolean
  mode?: RuntimeMode
  sw?: ServiceWorkerOptions
  playground?: boolean | {
    path?: string
    enabled?: boolean
  }
}

export type VitePluginOptionsInput = VitePluginOptions | VitePluginOptions[]

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
