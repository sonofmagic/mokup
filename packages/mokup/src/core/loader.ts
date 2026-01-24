import type { PreviewServer, ViteDevServer } from 'vite'
import type { Logger, RouteRule } from '../shared/types'
import { promises as fs } from 'node:fs'
import { parse as parseJsonc } from '@mokup/shared/jsonc-parser'
import { extname } from '@mokup/shared/pathe'
import { loadModule, loadModuleWithVite } from './module-loader'

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

/**
 * Load route rules from a mock file.
 *
 * @param file - Mock file path.
 * @param server - Optional Vite server for SSR module loading.
 * @param logger - Logger for parse warnings.
 * @returns Normalized route rules.
 *
 * @example
 * import { loadRules } from 'mokup/vite'
 *
 * const rules = await loadRules('/project/mock/ping.get.ts', undefined, console)
 */
export async function loadRules(
  file: string,
  server: ViteDevServer | PreviewServer | undefined,
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

  const mod = server ? await loadModuleWithVite(server, file) : await loadModule(file)
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
