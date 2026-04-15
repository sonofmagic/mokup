import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolveRegisterPath } from './paths'

function createSwMiddleware(params: {
  swConfig: { path: string } | null
  hasSwRoutes: () => boolean
  getBase: () => string
  ensureBuilt: () => Promise<void>
  getSwBundle: () => string | null
}) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ) => {
    if (!params.swConfig || !params.hasSwRoutes()) {
      return next()
    }
    const requestUrl = req.url ?? '/'
    const parsed = new URL(requestUrl, 'http://mokup.local')
    const swPath = resolveRegisterPath(params.getBase(), params.swConfig.path)
    if (parsed.pathname !== swPath) {
      return next()
    }

    await params.ensureBuilt()
    const bundle = params.getSwBundle()
    if (!bundle) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Failed to generate mokup service worker.')
      return
    }
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.end(bundle)
  }
}

export { createSwMiddleware }
