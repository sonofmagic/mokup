import type { MiddlewarePosition, RouteDirectoryConfig } from './types'

import { isPromise, resolveDirectoryConfig as resolveDirectoryConfigShared } from '@mokup/shared/config-utils'
import { loadModule } from '@mokup/shared/module-loader'
import { configExtensions } from '@mokup/shared/route-constants'

async function loadConfig(file: string): Promise<RouteDirectoryConfig | null> {
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

/**
 * Resolve and merge directory-level config files for the manifest build.
 *
 * @param params - Resolution parameters.
 * @param params.file - Route file path.
 * @param params.rootDir - Root directory for config lookup.
 * @param params.log - Optional logger for warnings.
 * @param params.configCache - Cache for resolved configs.
 * @param params.fileCache - Cache for config file contents.
 * @returns Resolved config and middleware list.
 *
 * @example
 * import { resolveDirectoryConfig } from '@mokup/cli'
 *
 * const config = await resolveDirectoryConfig({
 *   file: 'mock/users.get.ts',
 *   rootDir: 'mock',
 *   configCache: new Map(),
 *   fileCache: new Map(),
 * })
 */
export async function resolveDirectoryConfig(params: {
  file: string
  rootDir: string
  log?: (message: string) => void
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
  middlewares: Array<{ file: string, index: number, position: MiddlewarePosition }>
}> {
  const { file, rootDir, log, configCache, fileCache } = params
  const resolved = await resolveDirectoryConfigShared({
    file,
    rootDir,
    configExtensions,
    configCache,
    fileCache,
    loadConfig,
    ...(log ? { warn: log } : {}),
    mapMiddleware: (_handler, index, position, source) => ({
      file: source,
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
    middlewares: Array<{ file: string, index: number, position: MiddlewarePosition }>
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
