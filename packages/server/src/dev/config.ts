import type {
  Logger,
  MiddlewareHandler,
  MiddlewarePosition,
  ResolvedMiddleware,
  RouteDirectoryConfig,
} from './types'

import { Buffer } from 'node:buffer'
import { promises as fs } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

import { build as esbuild } from '@mokup/shared/esbuild'
import { dirname, join, normalize } from '@mokup/shared/pathe'
import { configExtensions } from './constants'
import { ensureTsxRegister } from './tsx-loader'

const middlewareSymbol = Symbol.for('mokup.config.middlewares')

interface MiddlewareMeta {
  pre?: unknown[]
  normal?: unknown[]
  post?: unknown[]
}

function isUnknownFileExtensionError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }
  const code = (error as { code?: string }).code
  if (code === 'ERR_UNKNOWN_FILE_EXTENSION') {
    return true
  }
  const message = (error as { message?: string }).message
  return typeof message === 'string' && message.includes('Unknown file extension')
}

async function loadTsModule(file: string, logger: Logger) {
  const cacheBust = Date.now()
  const fileUrl = `${pathToFileURL(file).href}?t=${cacheBust}`
  const registered = await ensureTsxRegister(logger)
  if (registered) {
    try {
      return await import(fileUrl)
    }
    catch (error) {
      if (!isUnknownFileExtensionError(error)) {
        throw error
      }
    }
  }
  const result = await esbuild({
    entryPoints: [file],
    bundle: true,
    format: 'esm',
    platform: 'node',
    sourcemap: 'inline',
    target: 'es2020',
    write: false,
  })
  const output = result.outputFiles[0]
  const code = output?.text ?? ''
  const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString(
    'base64',
  )}`
  return import(`${dataUrl}#${cacheBust}`)
}

async function loadModule(file: string, logger: Logger) {
  const ext = configExtensions.find(extension => file.endsWith(extension))
  if (ext === '.cjs') {
    const require = createRequire(import.meta.url)
    delete require.cache[file]
    return require(file)
  }
  if (ext === '.js' || ext === '.mjs') {
    return import(`${pathToFileURL(file).href}?t=${Date.now()}`)
  }
  if (ext === '.ts') {
    return loadTsModule(file, logger)
  }
  return null
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
  logger: Logger,
): Promise<RouteDirectoryConfig | null> {
  const mod = await loadModule(file, logger)
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
 * @returns Resolved config and normalized middleware list.
 *
 * @example
 * import { resolveDirectoryConfig } from '@mokup/server'
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

  for (const dir of chain) {
    const configPath = await findConfigFile(dir, fileCache)
    if (!configPath) {
      continue
    }
    let config = configCache.get(configPath)
    if (config === undefined) {
      config = await loadConfig(configPath, logger)
      configCache.set(configPath, config)
    }
    if (!config) {
      logger.warn(`Invalid config in ${configPath}`)
      continue
    }
    if (config.headers) {
      merged.headers = { ...(merged.headers ?? {}), ...config.headers }
    }
    if (typeof config.status === 'number') {
      merged.status = config.status
    }
    if (typeof config.delay === 'number') {
      merged.delay = config.delay
    }
    if (typeof config.enabled === 'boolean') {
      merged.enabled = config.enabled
    }
    if (typeof config.ignorePrefix !== 'undefined') {
      merged.ignorePrefix = config.ignorePrefix
    }
    if (typeof config.include !== 'undefined') {
      merged.include = config.include
    }
    if (typeof config.exclude !== 'undefined') {
      merged.exclude = config.exclude
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
  }
}
