import type { RouteToken } from '@mokup/runtime'
import type { Context, MiddlewareHandler } from 'hono'

export type HttpMethod
  = | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'OPTIONS'
    | 'HEAD'

export type MockContext = Context

export type MockMiddleware = MiddlewareHandler

export type MockResponseHandler = (
  context: Context,
) => Response | Promise<Response> | unknown

export type MockResponse = unknown | MockResponseHandler

export interface MockRule {
  response: MockResponse
  status?: number
  headers?: Record<string, string>
  delay?: number
}

export interface DirectoryConfig {
  headers?: Record<string, string>
  status?: number
  delay?: number
  enabled?: boolean
  middleware?: MockMiddleware | MockMiddleware[]
}

export interface ResolvedMiddleware {
  handle: MockMiddleware
  source: string
}

export interface MokupViteOptions {
  dir?: string | string[] | ((root: string) => string | string[])
  prefix?: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  watch?: boolean
  log?: boolean
  playground?: boolean | {
    path?: string
    enabled?: boolean
  }
}

export type MokupViteOptionsInput = MokupViteOptions | MokupViteOptions[]

export interface ResolvedRoute {
  file: string
  template: string
  method: HttpMethod
  tokens: RouteToken[]
  score: number[]
  response: MockResponse
  middlewares?: ResolvedMiddleware[]
  status?: number
  headers?: Record<string, string>
  delay?: number
}

export type RouteTable = ResolvedRoute[]

export interface Logger {
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}
