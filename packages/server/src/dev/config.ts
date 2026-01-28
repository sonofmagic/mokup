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

  return {
    headers: resolved.headers,
    status: resolved.status,
    delay: resolved.delay,
    enabled: resolved.enabled,
    ignorePrefix: resolved.ignorePrefix,
    include: resolved.include,
    exclude: resolved.exclude,
    middlewares: resolved.middlewares,
  }
}
