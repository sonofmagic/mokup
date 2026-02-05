import type {
  Logger,
  MiddlewareHandler,
  ResolvedMiddleware,
  RouteDirectoryConfig,
} from './types'

import { isPromise, resolveDirectoryConfig as resolveDirectoryConfigShared } from '@mokup/shared/config-utils'
import { loadModule } from '@mokup/shared/module-loader'
import { configExtensions } from './constants'

async function loadConfig(
  file: string,
): Promise<RouteDirectoryConfig | null> {
  const mod = await loadModule(file)
  if (!mod) {
    return null
  }
  const raw = (mod as { default?: unknown } | undefined)?.default ?? mod
  const value = isPromise(raw) ? await raw : raw
  if (!value || typeof value !== 'object') {
    return null
  }
  return value as RouteDirectoryConfig
}

export async function resolveDirectoryConfig(params: {
  file: string
  rootDir: string
  logger: Logger
  configCache: Map<string, RouteDirectoryConfig | null>
  fileCache: Map<string, string | null>
}): Promise<{
  headers?: Record<string, string>
  status?: number
  delay?: number
  enabled?: boolean
  ignorePrefix?: string | string[]
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  middlewares: ResolvedMiddleware[]
}> {
  const { file, rootDir, logger, configCache, fileCache } = params
  const resolved = await resolveDirectoryConfigShared({
    file,
    rootDir,
    configExtensions,
    configCache,
    fileCache,
    loadConfig,
    warn: message => logger.warn(message),
    mapMiddleware: (handler, index, position, source) => ({
      handle: handler as MiddlewareHandler,
      source,
      index,
      position,
    }),
  })

  const result: {
    headers?: Record<string, string>
    status?: number
    delay?: number
    enabled?: boolean
    ignorePrefix?: string | string[]
    include?: RegExp | RegExp[]
    exclude?: RegExp | RegExp[]
    middlewares: ResolvedMiddleware[]
  } = { middlewares: resolved.middlewares }
  if (resolved.headers) {
    result.headers = resolved.headers
  }
  if (typeof resolved.status === 'number') {
    result.status = resolved.status
  }
  if (typeof resolved.delay === 'number') {
    result.delay = resolved.delay
  }
  if (typeof resolved.enabled === 'boolean') {
    result.enabled = resolved.enabled
  }
  if (typeof resolved.ignorePrefix !== 'undefined') {
    result.ignorePrefix = resolved.ignorePrefix
  }
  if (typeof resolved.include !== 'undefined') {
    result.include = resolved.include
  }
  if (typeof resolved.exclude !== 'undefined') {
    result.exclude = resolved.exclude
  }
  return result
}
