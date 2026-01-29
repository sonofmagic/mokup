import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PreviewServer, ViteDevServer } from 'vite'
import type { RouteIgnoreInfo, RouteSkipInfo } from '../scanner'
import type { Logger, RouteTable } from '../shared/types'
import type { PlaygroundConfig } from './config'
import { promises as fs } from 'node:fs'
import { extname, join, normalize } from '@mokup/shared/pathe'
import { mimeTypes, resolvePlaygroundDist, sendFile, sendJson } from './assets'
import { resolvePlaygroundRequestPath } from './config'
import { resolveGroupRoot, resolveGroups } from './grouping'
import { injectPlaygroundHmr, injectPlaygroundSw, isViteDevServer } from './inject'
import {
  toPlaygroundConfigFile,
  toPlaygroundDisabledRoute,
  toPlaygroundIgnoredRoute,
  toPlaygroundRoute,
} from './serialize'

/**
 * Create middleware that serves the playground UI and routes data.
 *
 * @param params - Playground middleware parameters.
 * @param params.getRoutes - Getter for active routes.
 * @param params.getDisabledRoutes - Getter for disabled routes.
 * @param params.getIgnoredRoutes - Getter for ignored routes.
 * @param params.getConfigFiles - Getter for config files.
 * @param params.getDisabledConfigFiles - Getter for disabled config files.
 * @param params.config - Playground config.
 * @param params.logger - Logger instance.
 * @param params.getServer - Getter for the active dev server.
 * @param params.getDirs - Getter for scanned directories.
 * @param params.getSwScript - Getter for service worker lifecycle script.
 * @returns Connect-style middleware handler.
 *
 * @example
 * import { createPlaygroundMiddleware } from 'mokup/vite'
 *
 * const middleware = createPlaygroundMiddleware({
 *   config: { enabled: true, path: '/__mokup' },
 *   logger: console,
 *   getRoutes: () => [],
 * })
 */
export function createPlaygroundMiddleware(params: {
  getRoutes: () => RouteTable
  getDisabledRoutes?: () => RouteSkipInfo[]
  getIgnoredRoutes?: () => RouteIgnoreInfo[]
  getConfigFiles?: () => { file: string }[]
  getDisabledConfigFiles?: () => { file: string }[]
  config: PlaygroundConfig
  logger: Logger
  getServer?: () => ViteDevServer | PreviewServer | null
  getDirs?: () => string[]
  getSwScript?: () => string | null
}) {
  const distDir = resolvePlaygroundDist()
  const playgroundPath = params.config.path
  const indexPath = join(distDir, 'index.html')

  return async (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
    if (!params.config.enabled) {
      return next()
    }
    const server = params.getServer?.()
    const requestPath = resolvePlaygroundRequestPath(server?.config?.base ?? '/', playgroundPath)
    const requestUrl = req.url ?? '/'
    const url = new URL(requestUrl, 'http://mokup.local')
    const pathname = url.pathname
    const matchedPath = pathname.startsWith(requestPath)
      ? requestPath
      : pathname.startsWith(playgroundPath)
        ? playgroundPath
        : null
    if (!matchedPath) {
      return next()
    }

    const subPath = pathname.slice(matchedPath.length)
    if (subPath === '') {
      const suffix = url.search ?? ''
      res.statusCode = 302
      res.setHeader('Location', `${matchedPath}/${suffix}`)
      res.end()
      return
    }
    if (subPath === '' || subPath === '/' || subPath === '/index.html') {
      try {
        const html = await fs.readFile(indexPath, 'utf8')
        let output = html
        if (isViteDevServer(server)) {
          output = injectPlaygroundHmr(output, server.config.base ?? '/')
          output = injectPlaygroundSw(output, params.getSwScript?.())
        }
        const contentType = mimeTypes['.html'] ?? 'text/html; charset=utf-8'
        sendFile(res, output, contentType)
      }
      catch (error) {
        params.logger.error('Failed to load playground index:', error)
        res.statusCode = 500
        res.end('Playground is not available.')
      }
      return
    }

    if (subPath === '/routes') {
      const dirs = params.getDirs?.() ?? []
      const baseRoot = resolveGroupRoot(dirs, server?.config?.root)
      const groups = resolveGroups(dirs, baseRoot)
      const routes = params.getRoutes()
      const disabledRoutes = params.getDisabledRoutes?.() ?? []
      const ignoredRoutes = params.getIgnoredRoutes?.() ?? []
      const configFiles = params.getConfigFiles?.() ?? []
      const disabledConfigFiles = params.getDisabledConfigFiles?.() ?? []
      sendJson(res, {
        basePath: matchedPath,
        root: baseRoot,
        count: routes.length,
        groups: groups.map(group => ({ key: group.key, label: group.label })),
        routes: routes.map(route => toPlaygroundRoute(route, baseRoot, groups)),
        disabled: disabledRoutes.map(route => toPlaygroundDisabledRoute(route, baseRoot, groups)),
        ignored: ignoredRoutes.map(route => toPlaygroundIgnoredRoute(route, baseRoot, groups)),
        configs: configFiles.map(entry => toPlaygroundConfigFile(entry, baseRoot, groups)),
        disabledConfigs: disabledConfigFiles.map(entry => toPlaygroundConfigFile(entry, baseRoot, groups)),
      })
      return
    }

    const relPath = subPath.replace(/^\/+/, '')
    if (relPath.includes('..')) {
      res.statusCode = 400
      res.end('Invalid path.')
      return
    }

    const normalizedPath = normalize(relPath)
    const filePath = join(distDir, normalizedPath)
    try {
      const content = await fs.readFile(filePath)
      const ext = extname(filePath)
      const contentType = mimeTypes[ext] ?? 'application/octet-stream'
      sendFile(res, content, contentType)
    }
    catch {
      return next()
    }
  }
}
