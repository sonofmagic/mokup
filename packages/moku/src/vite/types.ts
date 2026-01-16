import type { IncomingMessage, ServerResponse } from 'node:http'

export type HttpMethod
  = | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'OPTIONS'
    | 'HEAD'

export interface MockRequest {
  url: string
  method: HttpMethod
  headers: IncomingMessage['headers']
  query: Record<string, string | string[]>
  body: unknown
  rawBody?: string
}

export interface MockContext {
  delay: (ms: number) => Promise<void>
  json: (data: unknown) => unknown
}

export type MockResponseHandler = (
  req: MockRequest,
  res: ServerResponse,
  ctx: MockContext,
) => unknown | Promise<unknown>

export type MockResponse = unknown | MockResponseHandler

export interface MockRule {
  url?: string
  method?: string
  response: MockResponse
  status?: number
  headers?: Record<string, string>
  delay?: number
}

export interface MokuViteOptions {
  dir?: string | string[] | ((root: string) => string | string[])
  prefix?: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  watch?: boolean
  log?: boolean
}

export interface ResolvedRoute {
  file: string
  url: string
  method: HttpMethod
  response: MockResponse
  status?: number
  headers?: Record<string, string>
  delay?: number
}

export type RouteTable = Map<string, ResolvedRoute>

export interface Logger {
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}
