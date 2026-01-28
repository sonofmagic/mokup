import { promises as fs } from 'node:fs'

import { isPromise, middlewareSymbol } from './config-core'
import { dirname, join, normalize } from './pathe'

export type MiddlewarePosition = 'pre' | 'normal' | 'post'

export interface MiddlewareMeta {
  pre?: unknown[]
  normal?: unknown[]
  post?: unknown[]
}

export interface ConfigSourceMap {
  headers?: string
  status?: string
  delay?: string
  enabled?: string
  ignorePrefix?: string
  include?: string
  exclude?: string
}

export function readMiddlewareMeta(config: Record<symbol, unknown>): MiddlewareMeta | null {
  const value = config[middlewareSymbol]
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

export { isPromise, middlewareSymbol }

export function normalizeMiddlewareList<T>(params: {
  value: unknown
  source: string
  position: MiddlewarePosition
  warn?: (message: string) => void
  map: (handler: (...args: unknown[]) => unknown, index: number, position: MiddlewarePosition) => T
}): T[] {
  const { value, source, position, warn, map } = params
  if (!value) {
    return []
  }
  const list = Array.isArray(value) ? value : [value]
  const middlewares: T[] = []
  list.forEach((entry, index) => {
    if (typeof entry !== 'function') {
      warn?.(`Invalid middleware in ${source}`)
      return
    }
    middlewares.push(map(entry, index, position))
  })
  return middlewares
}

export function buildConfigChain(file: string, rootDir: string) {
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
  return chain
}

export function getConfigFileCandidates(
  dir: string,
  extensions: readonly string[],
) {
  return extensions.map(extension => join(dir, `index.config${extension}`))
}

export async function findConfigFile(
  dir: string,
  cache: Map<string, string | null>,
  extensions: readonly string[],
): Promise<string | null> {
  const cached = cache.get(dir)
  if (cached !== undefined) {
    return cached
  }
  for (const candidate of getConfigFileCandidates(dir, extensions)) {
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

export async function resolveDirectoryConfig<TConfig extends {
  headers?: Record<string, string>
  status?: number
  delay?: number
  enabled?: boolean
  ignorePrefix?: string | string[]
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  middleware?: unknown
}, TMiddleware>(params: {
  file: string
  rootDir: string
  configExtensions: readonly string[]
  configCache: Map<string, TConfig | null>
  fileCache: Map<string, string | null>
  loadConfig: (file: string) => Promise<TConfig | null>
  warn?: (message: string) => void
  mapMiddleware: (handler: (...args: unknown[]) => unknown, index: number, position: MiddlewarePosition, source: string) => TMiddleware
}) {
  const { file, rootDir, configExtensions, configCache, fileCache, loadConfig, warn, mapMiddleware } = params
  const chain = buildConfigChain(file, rootDir)

  const merged: {
    headers?: Record<string, string>
    status?: number
    delay?: number
    enabled?: boolean
    ignorePrefix?: string | string[]
    include?: RegExp | RegExp[]
    exclude?: RegExp | RegExp[]
  } = {}
  const preMiddlewares: TMiddleware[] = []
  const normalMiddlewares: TMiddleware[] = []
  const postMiddlewares: TMiddleware[] = []
  const configChain: string[] = []
  const configSources: ConfigSourceMap = {}

  for (const dir of chain) {
    const configPath = await findConfigFile(dir, fileCache, configExtensions)
    if (!configPath) {
      continue
    }
    let config = configCache.get(configPath)
    if (config === undefined) {
      config = await loadConfig(configPath)
      configCache.set(configPath, config)
    }
    if (!config) {
      warn?.(`Invalid config in ${configPath}`)
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
    const meta = readMiddlewareMeta(config as unknown as Record<symbol, unknown>)
    preMiddlewares.push(
      ...normalizeMiddlewareList({
        value: meta?.pre,
        source: configPath,
        position: 'pre',
        warn,
        map: (handler, index, position) => mapMiddleware(handler, index, position, configPath),
      }),
    )
    normalMiddlewares.push(
      ...normalizeMiddlewareList({
        value: meta?.normal,
        source: configPath,
        position: 'normal',
        warn,
        map: (handler, index, position) => mapMiddleware(handler, index, position, configPath),
      }),
    )
    normalMiddlewares.push(
      ...normalizeMiddlewareList({
        value: config.middleware,
        source: configPath,
        position: 'normal',
        warn,
        map: (handler, index, position) => mapMiddleware(handler, index, position, configPath),
      }),
    )
    postMiddlewares.push(
      ...normalizeMiddlewareList({
        value: meta?.post,
        source: configPath,
        position: 'post',
        warn,
        map: (handler, index, position) => mapMiddleware(handler, index, position, configPath),
      }),
    )
  }

  return {
    ...merged,
    middlewares: [...preMiddlewares, ...normalMiddlewares, ...postMiddlewares],
    configChain,
    configSources,
  }
}
