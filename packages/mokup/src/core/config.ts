import type { PreviewServer, ViteDevServer } from 'vite'
import type {
  Logger,
  MiddlewareHandler,
  MiddlewarePosition,
  ResolvedMiddleware,
  RouteDirectoryConfig,
} from '../shared/types'

import { promises as fs } from 'node:fs'

import { dirname, join, normalize } from '@mokup/shared/pathe'
import { configExtensions } from '../shared/constants'
import { loadModule, loadModuleWithVite } from './module-loader'

const middlewareSymbol = Symbol.for('mokup.config.middlewares')

interface MiddlewareMeta {
  pre?: unknown[]
  normal?: unknown[]
  post?: unknown[]
}

interface ConfigSourceMap {
  headers?: string
  status?: string
  delay?: string
  enabled?: string
  ignorePrefix?: string
  include?: string
  exclude?: string
}

function getConfigFileCandidates(dir: string) {
  return configExtensions.map(extension => join(dir, `index.config${extension}`))
}

async function findConfigFile(
  dir: string,
  cache: Map<string, string | null>,
): Promise<string | null> {
  const cached = cache.get(dir)
  if (cached !== undefined) {
    return cached
  }
  for (const candidate of getConfigFileCandidates(dir)) {
    try {
      await fs.stat(candidate)
      cache.set(dir, candidate)
      return candidate
    }
    catch {
      continue
    }
  }
  cache.set(dir, null)
  return null
}

async function loadConfig(
  file: string,
  server: ViteDevServer | PreviewServer | undefined,
): Promise<RouteDirectoryConfig | null> {
  const mod = server ? await loadModuleWithVite(server, file) : await loadModule(file)
  if (!mod) {
    return null
  }
  const value = (mod as { default?: unknown } | undefined)?.default ?? mod
  if (!value || typeof value !== 'object') {
    return null
  }
  return value as RouteDirectoryConfig
}

function normalizeMiddlewares(
  value: unknown,
  source: string,
  logger: Logger,
  position: MiddlewarePosition,
): ResolvedMiddleware[] {
  if (!value) {
    return []
  }
  const list = Array.isArray(value) ? value : [value]
  const middlewares: ResolvedMiddleware[] = []
  for (const [index, entry] of list.entries()) {
    if (typeof entry !== 'function') {
      logger.warn(`Invalid middleware in ${source}`)
      continue
    }
    middlewares.push({
      handle: entry as MiddlewareHandler,
      source,
      index,
      position,
    })
  }
  return middlewares
}

function readMiddlewareMeta(config: RouteDirectoryConfig): MiddlewareMeta | null {
  const value = (config as Record<symbol, unknown>)[middlewareSymbol]
  if (!value || typeof value !== 'object') {
    return null
  }
  const meta = value as MiddlewareMeta
  return {
    pre: Array.isArray(meta.pre) ? meta.pre : [],
    normal: Array.isArray(meta.normal) ? meta.normal : [],
    post: Array.isArray(meta.post) ? meta.post : [],
  }
}

/**
 * Resolve and merge directory-level configuration files for a route file.
 *
 * @param params - Resolution parameters.
 * @param params.file - Route file path.
 * @param params.rootDir - Root directory for config lookup.
 * @param params.server - Optional dev/preview server.
 * @param params.logger - Logger for warnings.
 * @param params.configCache - Cache for resolved configs.
 * @param params.fileCache - Cache for config file contents.
 * @returns Resolved config and normalized middleware list.
 *
 * @example
 * import { resolveDirectoryConfig } from 'mokup/vite'
 *
 * const config = await resolveDirectoryConfig({
 *   file: '/project/mock/users.get.ts',
 *   rootDir: '/project/mock',
 *   logger: console,
 *   configCache: new Map(),
 *   fileCache: new Map(),
 * })
 */
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
  configSources: ConfigSourceMap
}> {
  const { file, rootDir, server, logger, configCache, fileCache } = params
  const resolvedRoot = normalize(rootDir)
  const resolvedFileDir = normalize(dirname(file))
  const chain: string[] = []
  let current = resolvedFileDir
  while (true) {
    chain.push(current)
    if (current === resolvedRoot) {
      break
    }
    const parent = dirname(current)
    if (parent === current) {
      break
    }
    current = parent
  }
  chain.reverse()

  const merged: {
    headers?: Record<string, string>
    status?: number
    delay?: number
    enabled?: boolean
    ignorePrefix?: string | string[]
    include?: RegExp | RegExp[]
    exclude?: RegExp | RegExp[]
  } = {}
  const preMiddlewares: ResolvedMiddleware[] = []
  const normalMiddlewares: ResolvedMiddleware[] = []
  const postMiddlewares: ResolvedMiddleware[] = []
  const configChain: string[] = []
  const configSources: ConfigSourceMap = {}

  for (const dir of chain) {
    const configPath = await findConfigFile(dir, fileCache)
    if (!configPath) {
      continue
    }
    let config = configCache.get(configPath)
    if (config === undefined) {
      config = await loadConfig(configPath, server)
      configCache.set(configPath, config)
    }
    if (!config) {
      logger.warn(`Invalid config in ${configPath}`)
      continue
    }
    configChain.push(configPath)
    if (config.headers) {
      merged.headers = { ...(merged.headers ?? {}), ...config.headers }
      configSources.headers = configPath
    }
    if (typeof config.status === 'number') {
      merged.status = config.status
      configSources.status = configPath
    }
    if (typeof config.delay === 'number') {
      merged.delay = config.delay
      configSources.delay = configPath
    }
    if (typeof config.enabled === 'boolean') {
      merged.enabled = config.enabled
      configSources.enabled = configPath
    }
    if (typeof config.ignorePrefix !== 'undefined') {
      merged.ignorePrefix = config.ignorePrefix
      configSources.ignorePrefix = configPath
    }
    if (typeof config.include !== 'undefined') {
      merged.include = config.include
      configSources.include = configPath
    }
    if (typeof config.exclude !== 'undefined') {
      merged.exclude = config.exclude
      configSources.exclude = configPath
    }
    const meta = readMiddlewareMeta(config)
    const normalizedPre = normalizeMiddlewares(
      meta?.pre,
      configPath,
      logger,
      'pre',
    )
    const normalizedNormal = normalizeMiddlewares(
      meta?.normal,
      configPath,
      logger,
      'normal',
    )
    const normalizedLegacy = normalizeMiddlewares(
      config.middleware,
      configPath,
      logger,
      'normal',
    )
    const normalizedPost = normalizeMiddlewares(
      meta?.post,
      configPath,
      logger,
      'post',
    )
    if (normalizedPre.length > 0) {
      preMiddlewares.push(...normalizedPre)
    }
    if (normalizedNormal.length > 0) {
      normalMiddlewares.push(...normalizedNormal)
    }
    if (normalizedLegacy.length > 0) {
      normalMiddlewares.push(...normalizedLegacy)
    }
    if (normalizedPost.length > 0) {
      postMiddlewares.push(...normalizedPost)
    }
  }

  return {
    ...merged,
    middlewares: [...preMiddlewares, ...normalMiddlewares, ...postMiddlewares],
    configChain,
    configSources,
  }
}
