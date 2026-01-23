import type { Hono } from '@mokup/shared/hono'
import type { Logger, RouteTable } from './types'

import { promises as fs } from 'node:fs'
import { createRequire } from 'node:module'
import { cwd } from 'node:process'
import { dirname, extname, join, normalize, relative } from '@mokup/shared/pathe'

interface PlaygroundConfig {
  enabled: boolean
  path: string
}

const mimeTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
}

function normalizePlaygroundPath(value?: string) {
  if (!value) {
    return '/__mokup'
  }
  const normalized = value.startsWith('/') ? value : `/${value}`
  return normalized.length > 1 && normalized.endsWith('/')
    ? normalized.slice(0, -1)
    : normalized
}

export function resolvePlaygroundOptions(
  playground: { path?: string, enabled?: boolean } | boolean | undefined,
): PlaygroundConfig {
  if (playground === false) {
    return { enabled: false, path: '/__mokup' }
  }
  if (playground && typeof playground === 'object') {
    return {
      enabled: playground.enabled !== false,
      path: normalizePlaygroundPath(playground.path),
    }
  }
  return { enabled: true, path: '/__mokup' }
}

function resolvePlaygroundDist() {
  const require = createRequire(import.meta.url)
  const pkgPath = require.resolve('@mokup/playground/package.json')
  return join(pkgPath, '..', 'dist')
}

function toPosixPath(value: string) {
  return value.replace(/\\/g, '/')
}

function normalizePath(value: string) {
  return toPosixPath(normalize(value))
}

function isAncestor(parent: string, child: string) {
  const normalizedParent = normalizePath(parent).replace(/\/$/, '')
  const normalizedChild = normalizePath(child)
  return normalizedChild === normalizedParent || normalizedChild.startsWith(`${normalizedParent}/`)
}

function resolveGroupRoot(
  dirs: string[],
  serverRoot?: string,
) {
  if (!dirs || dirs.length === 0) {
    return serverRoot ?? cwd()
  }
  if (serverRoot) {
    const normalizedRoot = normalizePath(serverRoot)
    const canUseRoot = dirs.every(dir => isAncestor(normalizedRoot, dir))
    if (canUseRoot) {
      return normalizedRoot
    }
  }
  if (dirs.length === 1) {
    return normalizePath(dirname(dirs[0]!))
  }
  let common = normalizePath(dirs[0]!)
  for (const dir of dirs.slice(1)) {
    const normalizedDir = normalizePath(dir)
    while (common && !isAncestor(common, normalizedDir)) {
      const parent = normalizePath(dirname(common))
      if (parent === common) {
        break
      }
      common = parent
    }
  }
  if (!common || common === '/') {
    return serverRoot ?? cwd()
  }
  return common
}

interface PlaygroundGroup {
  key: string
  label: string
  path: string
}

type PlaygroundDisabledReason
  = | 'disabled'
    | 'disabled-dir'
    | 'exclude'
    | 'ignore-prefix'
    | 'include'
    | 'unknown'

interface PlaygroundDisabledRouteInput {
  file: string
  reason?: string
  method?: string
  url?: string
}

interface PlaygroundDisabledRoute {
  file: string
  reason: PlaygroundDisabledReason
  method?: string
  url?: string
  group?: string
  groupKey?: string
}

type PlaygroundIgnoredReason = 'unsupported' | 'invalid-route' | 'unknown'

interface PlaygroundIgnoredRouteInput {
  file: string
  reason?: string
}

interface PlaygroundIgnoredRoute {
  file: string
  reason: PlaygroundIgnoredReason
  group?: string
  groupKey?: string
}

interface PlaygroundConfigFileInput {
  file: string
}

interface PlaygroundConfigFile {
  file: string
  group?: string
  groupKey?: string
}

const disabledReasonSet = new Set<PlaygroundDisabledReason>([
  'disabled',
  'disabled-dir',
  'exclude',
  'ignore-prefix',
  'include',
  'unknown',
])

const ignoredReasonSet = new Set<PlaygroundIgnoredReason>([
  'unsupported',
  'invalid-route',
  'unknown',
])

function normalizeDisabledReason(reason?: string): PlaygroundDisabledReason {
  if (reason && disabledReasonSet.has(reason as PlaygroundDisabledReason)) {
    return reason as PlaygroundDisabledReason
  }
  return 'unknown'
}

function normalizeIgnoredReason(reason?: string): PlaygroundIgnoredReason {
  if (reason && ignoredReasonSet.has(reason as PlaygroundIgnoredReason)) {
    return reason as PlaygroundIgnoredReason
  }
  return 'unknown'
}

function formatRouteFile(file: string, root?: string) {
  if (!root) {
    return toPosixPath(file)
  }
  const rel = toPosixPath(relative(root, file))
  if (!rel || rel.startsWith('..')) {
    return toPosixPath(file)
  }
  return rel
}

function resolveGroups(dirs: string[], root: string) {
  const groups: PlaygroundGroup[] = []
  const seen = new Set<string>()
  for (const dir of dirs) {
    const normalized = normalizePath(dir)
    if (seen.has(normalized)) {
      continue
    }
    seen.add(normalized)
    const rel = toPosixPath(relative(root, normalized))
    const label = rel && !rel.startsWith('..') ? rel : normalized
    groups.push({
      key: normalized,
      label,
      path: normalized,
    })
  }
  return groups
}

function resolveRouteGroup(routeFile: string, groups: PlaygroundGroup[]) {
  if (groups.length === 0) {
    return undefined
  }
  const normalizedFile = toPosixPath(normalize(routeFile))
  let matched: PlaygroundGroup | undefined
  for (const group of groups) {
    if (normalizedFile === group.path || normalizedFile.startsWith(`${group.path}/`)) {
      if (!matched || group.path.length > matched.path.length) {
        matched = group
      }
    }
  }
  return matched
}

function toPlaygroundRoute(
  route: RouteTable[number],
  root: string | undefined,
  groups: PlaygroundGroup[],
) {
  const matchedGroup = resolveRouteGroup(route.file, groups)
  const middlewareSources = route.middlewares?.map(entry => formatRouteFile(entry.source, root))
  return {
    method: route.method,
    url: route.template,
    file: formatRouteFile(route.file, root),
    type: typeof route.handler === 'function' ? 'handler' : 'static',
    status: route.status,
    delay: route.delay,
    middlewareCount: middlewareSources?.length ?? 0,
    middlewares: middlewareSources,
    groupKey: matchedGroup?.key,
    group: matchedGroup?.label,
  }
}

function toPlaygroundDisabledRoute(
  route: PlaygroundDisabledRouteInput,
  root: string | undefined,
  groups: PlaygroundGroup[],
): PlaygroundDisabledRoute {
  const matchedGroup = resolveRouteGroup(route.file, groups)
  const disabled: PlaygroundDisabledRoute = {
    file: formatRouteFile(route.file, root),
    reason: normalizeDisabledReason(route.reason),
  }
  if (typeof route.method !== 'undefined') {
    disabled.method = route.method
  }
  if (typeof route.url !== 'undefined') {
    disabled.url = route.url
  }
  if (matchedGroup) {
    disabled.groupKey = matchedGroup.key
    disabled.group = matchedGroup.label
  }
  return disabled
}

function toPlaygroundIgnoredRoute(
  route: PlaygroundIgnoredRouteInput,
  root: string | undefined,
  groups: PlaygroundGroup[],
): PlaygroundIgnoredRoute {
  const matchedGroup = resolveRouteGroup(route.file, groups)
  const ignored: PlaygroundIgnoredRoute = {
    file: formatRouteFile(route.file, root),
    reason: normalizeIgnoredReason(route.reason),
  }
  if (matchedGroup) {
    ignored.groupKey = matchedGroup.key
    ignored.group = matchedGroup.label
  }
  return ignored
}

function toPlaygroundConfigFile(
  entry: PlaygroundConfigFileInput,
  root: string | undefined,
  groups: PlaygroundGroup[],
): PlaygroundConfigFile {
  const matchedGroup = resolveRouteGroup(entry.file, groups)
  const configFile: PlaygroundConfigFile = {
    file: formatRouteFile(entry.file, root),
  }
  if (matchedGroup) {
    configFile.groupKey = matchedGroup.key
    configFile.group = matchedGroup.label
  }
  return configFile
}

export function registerPlaygroundRoutes(params: {
  app: Hono
  routes: RouteTable
  disabledRoutes?: PlaygroundDisabledRouteInput[]
  ignoredRoutes?: PlaygroundIgnoredRouteInput[]
  configFiles?: PlaygroundConfigFileInput[]
  disabledConfigFiles?: PlaygroundConfigFileInput[]
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
      const html = await fs.readFile(indexPath, 'utf8')
      const contentType = mimeTypes['.html'] ?? 'text/html; charset=utf-8'
      return new Response(html, { headers: { 'Content-Type': contentType } })
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
    if (relPath.includes('..')) {
      return new Response('Invalid path.', { status: 400 })
    }
    const normalizedPath = normalize(relPath)
    const filePath = join(distDir, normalizedPath)
    try {
      const content = await fs.readFile(filePath)
      const ext = extname(filePath)
      const contentType = mimeTypes[ext] ?? 'application/octet-stream'
      return new Response(content, { headers: { 'Content-Type': contentType } })
    }
    catch {
      return c.notFound()
    }
  })
}
