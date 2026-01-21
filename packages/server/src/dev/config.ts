import type { Logger, MiddlewareHandler, ResolvedMiddleware, RouteDirectoryConfig } from './types'

import { Buffer } from 'node:buffer'
import { promises as fs } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

import { build as esbuild } from '@mokup/shared/esbuild'
import { dirname, join, normalize } from '@mokup/shared/pathe'

const configExtensions = ['.ts', '.js', '.mjs', '.cjs']

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

async function loadConfig(
  file: string,
): Promise<RouteDirectoryConfig | null> {
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
  value: RouteDirectoryConfig['middleware'],
  source: string,
  logger: Logger,
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
    middlewares.push({ handle: entry as MiddlewareHandler, source, index })
  }
  return middlewares
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
    middlewares: ResolvedMiddleware[]
  } = { middlewares: [] }

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
    const normalized = normalizeMiddlewares(config.middleware, configPath, logger)
    if (normalized.length > 0) {
      merged.middlewares.push(...normalized)
    }
  }

  return merged
}
