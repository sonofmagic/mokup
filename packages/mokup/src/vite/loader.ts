import type { PreviewServer, ViteDevServer } from 'vite'
import type { Logger, MockRule } from './types'
import { Buffer } from 'node:buffer'
import { promises as fs } from 'node:fs'

import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { build as esbuild } from '@mokup/shared/esbuild'
import { parse as parseJsonc } from '@mokup/shared/jsonc-parser'

import { extname } from '@mokup/shared/pathe'

async function loadModule(file: string) {
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

async function loadModuleWithVite(server: ViteDevServer | PreviewServer, file: string) {
  const asDevServer = server as ViteDevServer
  if ('ssrLoadModule' in asDevServer) {
    const moduleNode = asDevServer.moduleGraph.getModuleById(file)
    if (moduleNode) {
      asDevServer.moduleGraph.invalidateModule(moduleNode)
    }
    return asDevServer.ssrLoadModule(file)
  }
  return loadModule(file)
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
  server: ViteDevServer | PreviewServer | undefined,
  logger: Logger,
): Promise<MockRule[]> {
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

  const mod = server ? await loadModuleWithVite(server, file) : await loadModule(file)
  const value = (mod as { default?: unknown } | undefined)?.default ?? mod
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value as MockRule[]
  }
  if (typeof value === 'function') {
    return [
      {
        handler: value,
      },
    ]
  }
  return [value as MockRule]
}
