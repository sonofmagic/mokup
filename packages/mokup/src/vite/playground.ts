import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PreviewServer, ViteDevServer } from 'vite'
import type { Logger, MokupViteOptions, RouteTable } from './types'
import { promises as fs } from 'node:fs'
import { createRequire } from 'node:module'
import { cwd } from 'node:process'
import { extname, join, normalize, relative } from 'pathe'

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

function toPlaygroundRoute(route: RouteTable[number], root?: string) {
  return {
    method: route.method,
    url: route.template,
    file: formatRouteFile(route.file, root),
    type: typeof route.response === 'function' ? 'handler' : 'static',
    status: route.status,
    delay: route.delay,
  }
}

export function createPlaygroundMiddleware(params: {
  getRoutes: () => RouteTable
  config: PlaygroundConfig
  logger: Logger
  getServer?: () => ViteDevServer | PreviewServer | null
}) {
  const distDir = resolvePlaygroundDist()
  const playgroundPath = params.config.path
  const indexPath = join(distDir, 'index.html')

  return async (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
    if (!params.config.enabled) {
      return next()
    }
    const requestUrl = req.url ?? '/'
    const url = new URL(requestUrl, 'http://mokup.local')
    const pathname = url.pathname
    if (!pathname.startsWith(playgroundPath)) {
      return next()
    }

    const subPath = pathname.slice(playgroundPath.length)
    if (subPath === '') {
      const suffix = url.search ?? ''
      res.statusCode = 302
      res.setHeader('Location', `${playgroundPath}/${suffix}`)
      res.end()
      return
    }
    if (subPath === '' || subPath === '/' || subPath === '/index.html') {
      try {
        const html = await fs.readFile(indexPath, 'utf8')
        const server = params.getServer?.()
        const output = isViteDevServer(server)
          ? injectPlaygroundHmr(html, server.config.base ?? '/')
          : html
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
      const server = params.getServer?.()
      const baseRoot = server?.config?.root ?? cwd()
      const routes = params.getRoutes()
      sendJson(res, {
        basePath: playgroundPath,
        count: routes.length,
        routes: routes.map(route => toPlaygroundRoute(route, baseRoot)),
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
