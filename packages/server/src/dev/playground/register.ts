import type { Hono } from '@mokup/shared/hono'
import type { Logger, RouteTable } from '../types'
import type { PlaygroundConfig } from './config'
import { join } from '@mokup/shared/pathe'
import { readPlaygroundAsset, readPlaygroundIndex, resolvePlaygroundDist } from './assets'
import { normalizePlaygroundPath } from './config'
import { resolveGroupRoot, resolveGroups } from './grouping'
import {
  toPlaygroundConfigFile,
  toPlaygroundDisabledRoute,
  toPlaygroundIgnoredRoute,
  toPlaygroundRoute,
} from './serialize'

/**
 * Register playground routes on a Hono app.
 *
 * @param params - Playground registration parameters.
 * @param params.app - Hono app instance.
 * @param params.routes - Active route table.
 * @param params.disabledRoutes - Disabled route metadata.
 * @param params.ignoredRoutes - Ignored route metadata.
 * @param params.configFiles - Config file metadata.
 * @param params.disabledConfigFiles - Disabled config file metadata.
 * @param params.dirs - Source directories.
 * @param params.logger - Logger instance.
 * @param params.config - Playground config.
 * @param params.root - Optional workspace root.
 *
 * @example
 * import { registerPlaygroundRoutes } from '@mokup/server'
 *
 * registerPlaygroundRoutes({
 *   app: new (class { get() {} })() as any,
 *   routes: [],
 *   dirs: [],
 *   logger: console,
 *   config: { enabled: true, path: '/__mokup' },
 * })
 */
export function registerPlaygroundRoutes(params: {
  app: Hono
  routes: RouteTable
  disabledRoutes?: { file: string, reason?: string, method?: string, url?: string }[]
  ignoredRoutes?: { file: string, reason?: string }[]
  configFiles?: { file: string }[]
  disabledConfigFiles?: { file: string }[]
  dirs: string[]
  logger: Logger
  config: PlaygroundConfig
  root?: string
}) {
  if (!params.config.enabled) {
    return
  }
  const playgroundPath = normalizePlaygroundPath(params.config.path)
  const distDir = resolvePlaygroundDist()
  const indexPath = join(distDir, 'index.html')

  const serveIndex = async () => {
    try {
      return await readPlaygroundIndex(indexPath)
    }
    catch (error) {
      params.logger.error('Failed to load playground index:', error)
      return new Response('Playground is not available.', { status: 500 })
    }
  }

  params.app.get(playgroundPath, (c) => {
    try {
      const pathname = new URL(c.req.raw.url, 'http://localhost').pathname
      if (pathname.endsWith('/')) {
        return serveIndex()
      }
    }
    catch {
      // fall back to redirect
    }
    return c.redirect(`${playgroundPath}/`)
  })
  params.app.get(`${playgroundPath}/`, () => serveIndex())
  params.app.get(`${playgroundPath}/index.html`, () => serveIndex())
  params.app.get(`${playgroundPath}/routes`, (c) => {
    const baseRoot = resolveGroupRoot(params.dirs, params.root)
    const groups = resolveGroups(params.dirs, baseRoot)
    return c.json({
      basePath: playgroundPath,
      root: baseRoot,
      count: params.routes.length,
      groups: groups.map(group => ({ key: group.key, label: group.label })),
      routes: params.routes.map(route => toPlaygroundRoute(route, baseRoot, groups)),
      disabled: (params.disabledRoutes ?? []).map(route => toPlaygroundDisabledRoute(route, baseRoot, groups)),
      ignored: (params.ignoredRoutes ?? []).map(route => toPlaygroundIgnoredRoute(route, baseRoot, groups)),
      configs: (params.configFiles ?? []).map(entry => toPlaygroundConfigFile(entry, baseRoot, groups)),
      disabledConfigs: (params.disabledConfigFiles ?? []).map(entry =>
        toPlaygroundConfigFile(entry, baseRoot, groups),
      ),
    })
  })
  params.app.get(`${playgroundPath}/*`, async (c) => {
    const pathname = c.req.path
    const relPath = pathname.slice(playgroundPath.length).replace(/^\/+/, '')
    if (!relPath || relPath === '/') {
      return serveIndex()
    }
    try {
      return await readPlaygroundAsset(distDir, relPath)
    }
    catch {
      return c.notFound()
    }
  })
}
