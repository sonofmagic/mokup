import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PreviewServer, ViteDevServer } from 'vite'
import type { Logger, MokupViteOptions, RouteTable } from './types'
import { promises as fs } from 'node:fs'
import { createRequire } from 'node:module'
import { cwd } from 'node:process'
import { dirname, extname, join, normalize, relative } from 'pathe'

const require = createRequire(import.meta.url)

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
    return '/_mokup'
  }
  const normalized = value.startsWith('/') ? value : `/${value}`
  return normalized.length > 1 && normalized.endsWith('/')
    ? normalized.slice(0, -1)
    : normalized
}

function normalizeBase(base: string) {
  if (!base || base === '/') {
    return ''
  }
  return base.endsWith('/') ? base.slice(0, -1) : base
}

function resolvePlaygroundRequestPath(base: string, playgroundPath: string) {
  const normalizedBase = normalizeBase(base)
  const normalizedPath = normalizePlaygroundPath(playgroundPath)
  if (!normalizedBase) {
    return normalizedPath
  }
  if (normalizedPath.startsWith(normalizedBase)) {
    return normalizedPath
  }
  return `${normalizedBase}${normalizedPath}`
}

function injectPlaygroundHmr(html: string, base: string) {
  if (html.includes('mokup-playground-hmr')) {
    return html
  }
  const normalizedBase = normalizeBase(base)
  const clientPath = `${normalizedBase}/@vite/client`
  const snippet = [
    '<script type="module" id="mokup-playground-hmr">',
    `import('${clientPath}').then(({ createHotContext }) => {`,
    '  const hot = createHotContext(\'/@mokup/playground\')',
    '  hot.on(\'mokup:routes-changed\', () => {',
    '    const api = window.__MOKUP_PLAYGROUND__',
    '    if (api && typeof api.reloadRoutes === \'function\') {',
    '      api.reloadRoutes()',
    '      return',
    '    }',
    '    window.location.reload()',
    '  })',
    '}).catch(() => {})',
    '</script>',
  ].join('\n')
  if (html.includes('</body>')) {
    return html.replace('</body>', `${snippet}\n</body>`)
  }
  return `${html}\n${snippet}`
}

function injectPlaygroundSw(html: string, script: string | null | undefined) {
  if (!script) {
    return html
  }
  if (html.includes('mokup-playground-sw')) {
    return html
  }
  const snippet = [
    '<script type="module" id="mokup-playground-sw">',
    script,
    '</script>',
  ].join('\n')
  if (html.includes('</head>')) {
    return html.replace('</head>', `${snippet}\n</head>`)
  }
  if (html.includes('</body>')) {
    return html.replace('</body>', `${snippet}\n</body>`)
  }
  return `${html}\n${snippet}`
}

function isViteDevServer(
  server: ViteDevServer | PreviewServer | undefined | null,
): server is ViteDevServer {
  return !!server && 'ws' in server
}

export function resolvePlaygroundOptions(
  playground: MokupViteOptions['playground'],
): PlaygroundConfig {
  if (playground === false) {
    return { enabled: false, path: '/_mokup' }
  }
  if (playground && typeof playground === 'object') {
    return {
      enabled: playground.enabled !== false,
      path: normalizePlaygroundPath(playground.path),
    }
  }
  return { enabled: true, path: '/_mokup' }
}

function resolvePlaygroundDist() {
  const pkgPath = require.resolve('@mokup/playground/package.json')
  return join(pkgPath, '..', 'dist')
}

function sendJson(
  res: ServerResponse,
  data: unknown,
  statusCode = 200,
) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data, null, 2))
}

function sendFile(
  res: ServerResponse,
  content: string | Uint8Array,
  contentType: string,
) {
  res.statusCode = 200
  res.setHeader('Content-Type', contentType)
  res.end(content)
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

export function createPlaygroundMiddleware(params: {
  getRoutes: () => RouteTable
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
      sendJson(res, {
        basePath: matchedPath,
        root: baseRoot,
        count: routes.length,
        groups: groups.map(group => ({ key: group.key, label: group.label })),
        routes: routes.map(route => toPlaygroundRoute(route, baseRoot, groups)),
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
