import type { MiddlewareHandler } from '@mokup/shared/hono'

export interface BuildOptions {
  dir?: string | string[]
  outDir?: string
  prefix?: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  handlers?: boolean
  root?: string
  log?: (message: string) => void
}

export interface RouteRule {
  handler: unknown
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

export interface FileInfo {
  file: string
  rootDir: string
}
