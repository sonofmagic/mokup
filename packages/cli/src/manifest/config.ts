import type { MiddlewarePosition, RouteDirectoryConfig } from './types'

import { Buffer } from 'node:buffer'
import { promises as fs } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

import { build as esbuild } from '@mokup/shared/esbuild'
import { dirname, join, normalize } from '@mokup/shared/pathe'

const configExtensions = ['.ts', '.js', '.mjs', '.cjs']
const middlewareSymbol = Symbol.for('mokup.config.middlewares')

interface MiddlewareMeta {
  pre?: unknown[]
  normal?: unknown[]
  post?: unknown[]
}

async function loadModule(file: string) {
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
    return import(`${dataUrl}#${Date.now()}`)
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

async function loadConfig(file: string): Promise<RouteDirectoryConfig | null> {
  const mod = await loadModule(file)
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
  log: ((message: string) => void) | undefined,
  position: MiddlewarePosition,
) {
  if (!value) {
    return []
  }
  const list = Array.isArray(value) ? value : [value]
  const middlewares: Array<{ file: string, index: number, position: MiddlewarePosition }> = []
  list.forEach((entry, index) => {
    if (typeof entry !== 'function') {
      log?.(`Invalid middleware in ${source}`)
      return
    }
    middlewares.push({ file: source, index, position })
  })
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
 * Resolve and merge directory-level config files for the manifest build.
 *
 * @param params - Resolution parameters.
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
  const preMiddlewares: Array<{ file: string, index: number, position: MiddlewarePosition }> = []
  const normalMiddlewares: Array<{ file: string, index: number, position: MiddlewarePosition }> = []
  const postMiddlewares: Array<{ file: string, index: number, position: MiddlewarePosition }> = []

  for (const dir of chain) {
    const configPath = await findConfigFile(dir, fileCache)
    if (!configPath) {
      continue
    }
    let config = configCache.get(configPath)
    if (config === undefined) {
      config = await loadConfig(configPath)
      configCache.set(configPath, config)
    }
    if (!config) {
      log?.(`Invalid config in ${configPath}`)
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
      log,
      'pre',
    )
    const normalizedNormal = normalizeMiddlewares(
      meta?.normal,
      configPath,
      log,
      'normal',
    )
    const normalizedLegacy = normalizeMiddlewares(
      config.middleware,
      configPath,
      log,
      'normal',
    )
    const normalizedPost = normalizeMiddlewares(
      meta?.post,
      configPath,
      log,
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
