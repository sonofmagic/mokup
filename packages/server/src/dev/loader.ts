import type { Logger, RouteRule } from './types'
import { Buffer } from 'node:buffer'
import { promises as fs } from 'node:fs'

import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { build as esbuild } from '@mokup/shared/esbuild'
import { parse as parseJsonc } from '@mokup/shared/jsonc-parser'

import { extname } from '@mokup/shared/pathe'
import { ensureTsxRegister } from './tsx-loader'

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
  const ext = extname(file).toLowerCase()
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

async function readJsonFile(file: string, logger: Logger) {
  try {
    const content = await fs.readFile(file, 'utf8')
    const errors: { error: number, offset: number, length: number }[] = []
    const data = parseJsonc(content, errors, {
      allowTrailingComma: true,
      disallowComments: false,
    })
    if (errors.length > 0) {
      logger.warn(`Invalid JSONC in ${file}`)
      return undefined
    }
    return data
  }
  catch (error) {
    logger.warn(`Failed to read ${file}: ${String(error)}`)
    return undefined
  }
}

export async function loadRules(
  file: string,
  logger: Logger,
): Promise<RouteRule[]> {
  const ext = extname(file).toLowerCase()
  if (ext === '.json' || ext === '.jsonc') {
    const json = await readJsonFile(file, logger)
    if (typeof json === 'undefined') {
      return []
    }
    return [
      {
        handler: json,
      },
    ]
  }

  const mod = await loadModule(file, logger)
  const value = (mod as { default?: unknown } | undefined)?.default ?? mod
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value as RouteRule[]
  }
  if (typeof value === 'function') {
    return [
      {
        handler: value,
      },
    ]
  }
  return [value as RouteRule]
}
