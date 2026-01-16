import type { PreviewServer, ViteDevServer } from 'vite'

import type { Logger, RouteTable } from './types'
import { collectFiles, isSupportedFile } from './files'
import { loadRules } from './loader'
import { deriveRouteFromFile, resolveRule, sortRoutes } from './routes'
import { matchesFilter } from './utils'

export async function scanRoutes(params: {
  dirs: string[]
  prefix: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  server?: ViteDevServer | PreviewServer
  logger: Logger
}): Promise<RouteTable> {
  const routes: RouteTable = []
  const seen = new Set<string>()
  const files = await collectFiles(params.dirs)
  for (const fileInfo of files) {
    if (!isSupportedFile(fileInfo.file)) {
      continue
    }
    if (!matchesFilter(fileInfo.file, params.include, params.exclude)) {
      continue
    }
    const derived = deriveRouteFromFile(fileInfo.file, fileInfo.rootDir, params.logger)
    if (!derived) {
      continue
    }
    const rules = await loadRules(fileInfo.file, params.server, params.logger)
    for (const rule of rules) {
      if (!rule || typeof rule !== 'object') {
        continue
      }
      if (typeof rule.response === 'undefined') {
        params.logger.warn(`Skip mock without response: ${fileInfo.file}`)
        continue
      }
      const resolved = resolveRule({
        rule,
        derivedTemplate: derived.template,
        derivedMethod: derived.method,
        prefix: params.prefix,
        file: fileInfo.file,
        logger: params.logger,
      })
      if (!resolved) {
        continue
      }
      const key = `${resolved.method} ${resolved.template}`
      if (seen.has(key)) {
        params.logger.warn(`Duplicate mock route ${key} from ${fileInfo.file}`)
      }
      seen.add(key)
      routes.push(resolved)
    }
  }
  return sortRoutes(routes)
}
