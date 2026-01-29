import type { PreviewServer, ViteDevServer } from 'vite'
import type {
  Logger,
  MiddlewareHandler,
  ResolvedMiddleware,
  RouteDirectoryConfig,
} from './shared/types'

import { isPromise, resolveDirectoryConfig as resolveDirectoryConfigShared } from '@mokup/shared/config-utils'
import { loadModule, loadModuleWithVite } from './module-loader'
import { configExtensions } from './shared/constants'

async function loadConfig(
  file: string,
  server: ViteDevServer | PreviewServer | undefined,
): Promise<RouteDirectoryConfig | null> {
  const mod = server ? await loadModuleWithVite(server, file) : await loadModule(file)
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
  server?: ViteDevServer | PreviewServer
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
  configChain: string[]
  configSources: {
    headers?: string
    status?: string
    delay?: string
    enabled?: string
    ignorePrefix?: string
    include?: string
    exclude?: string
  }
}> {
  const { file, rootDir, server, logger, configCache, fileCache } = params
  const resolved = await resolveDirectoryConfigShared({
    file,
    rootDir,
    configExtensions,
    configCache,
    fileCache,
    loadConfig: configFile => loadConfig(configFile, server),
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
    configChain: resolved.configChain,
    configSources: resolved.configSources,
  }
}
