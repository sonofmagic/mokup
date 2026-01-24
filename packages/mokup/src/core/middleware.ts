import type { Context } from '@mokup/shared/hono'
import type { IncomingMessage, ServerResponse } from 'node:http'

import type { Logger, ResolvedRoute, RouteTable } from '../shared/types'
import { Buffer } from 'node:buffer'
import { Hono, PatternRouter } from '@mokup/shared/hono'
import { delay, normalizeMethod } from '../shared/utils'

function toHonoPath(route: ResolvedRoute) {
  if (!route.tokens || route.tokens.length === 0) {
    return '/'
  }
  const segments = route.tokens.map((token) => {
    if (token.type === 'static') {
      return token.value
    }
    if (token.type === 'param') {
      return `:${token.name}`
    }
    if (token.type === 'catchall') {
      return `:${token.name}{.+}`
    }
    return `:${token.name}{.+}?`
  })
  return `/${segments.join('/')}`
}

function isValidStatus(status: unknown): status is number {
  return typeof status === 'number'
    && Number.isFinite(status)
    && status >= 200
    && status <= 599
}

function resolveStatus(routeStatus: number | undefined, responseStatus: number) {
  if (isValidStatus(routeStatus)) {
    return routeStatus
  }
  if (isValidStatus(responseStatus)) {
    return responseStatus
  }
  return 200
}

function applyRouteOverrides(response: Response, route: ResolvedRoute) {
  const headers = new Headers(response.headers)
  const hasHeaders = !!route.headers && Object.keys(route.headers).length > 0
  if (route.headers) {
    for (const [key, value] of Object.entries(route.headers)) {
      headers.set(key, value)
    }
  }
  const status = resolveStatus(route.status, response.status)
  if (status === response.status && !hasHeaders) {
    return response
  }
  return new Response(response.body, { status, headers })
}

function resolveResponse(value: unknown, fallback: Response) {
  if (value instanceof Response) {
    return value
  }
  if (value && typeof value === 'object' && 'res' in value) {
    const resolved = (value as { res?: unknown }).res
    if (resolved instanceof Response) {
      return resolved
    }
  }
  return fallback
}

function normalizeHandlerValue(c: Context, value: unknown): Response {
  if (value instanceof Response) {
    return value
  }
  if (typeof value === 'undefined') {
    const response = c.body(null)
    if (response.status === 200) {
      return new Response(response.body, {
        status: 204,
        headers: response.headers,
      })
    }
    return response
  }
  if (typeof value === 'string') {
    return c.text(value)
  }
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
    if (!c.res.headers.get('content-type')) {
      c.header('content-type', 'application/octet-stream')
    }
    const data = value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(value)
    return c.body(data)
  }
  return c.json(value)
}

function createRouteHandler(route: ResolvedRoute) {
  return async (c: Context) => {
    const value = typeof route.handler === 'function'
      ? await route.handler(c)
      : route.handler
    return normalizeHandlerValue(c, value)
  }
}

function createFinalizeMiddleware(route: ResolvedRoute) {
  return async (c: Context, next: () => Promise<Response | void>) => {
    const response = await next()
    const resolved = resolveResponse(response, c.res)
    if (route.delay && route.delay > 0) {
      await delay(route.delay)
    }
    const overridden = applyRouteOverrides(resolved, route)
    c.res = overridden
    return overridden
  }
}

function wrapMiddleware(
  handler: (c: Context, next: () => Promise<void>) => Promise<Response | void>,
) {
  return async (c: Context, next: () => Promise<void>) => {
    const response = await handler(c, next)
    return resolveResponse(response, c.res)
  }
}

function splitRouteMiddlewares(route: ResolvedRoute) {
  const before: Array<ReturnType<typeof wrapMiddleware>> = []
  const normal: Array<ReturnType<typeof wrapMiddleware>> = []
  const after: Array<ReturnType<typeof wrapMiddleware>> = []
  for (const entry of route.middlewares ?? []) {
    const wrapped = wrapMiddleware(entry.handle)
    if (entry.position === 'post') {
      after.push(wrapped)
    }
    else if (entry.position === 'pre') {
      before.push(wrapped)
    }
    else {
      normal.push(wrapped)
    }
  }
  return { before, normal, after }
}

/**
 * Build a Hono app for the resolved route table.
 *
 * @param routes - Resolved route table.
 * @returns Hono app instance.
 *
 * @example
 * import { createHonoApp } from 'mokup/vite'
 *
 * const app = createHonoApp([])
 */
export function createHonoApp(routes: RouteTable): Hono {
  const app = new Hono({ router: new PatternRouter(), strict: false })

  for (const route of routes) {
    const { before, normal, after } = splitRouteMiddlewares(route)
    app.on(
      route.method,
      toHonoPath(route),
      createFinalizeMiddleware(route),
      ...before,
      ...normal,
      ...after,
      createRouteHandler(route),
    )
  }

  return app
}

async function readRawBody(req: IncomingMessage) {
  return await new Promise<Uint8Array | null>((resolve, reject) => {
    const chunks: Uint8Array[] = []
    req.on('data', (chunk) => {
      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk))
        return
      }
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk)
        return
      }
      chunks.push(Buffer.from(String(chunk)))
    })
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve(null)
        return
      }
      resolve(Buffer.concat(chunks))
    })
    req.on('error', reject)
  })
}

function buildHeaders(headers: IncomingMessage['headers']) {
  const result = new Headers()
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'undefined') {
      continue
    }
    if (Array.isArray(value)) {
      result.set(key, value.join(','))
    }
    else {
      result.set(key, value)
    }
  }
  return result
}

async function toRequest(req: IncomingMessage) {
  const url = new URL(req.url ?? '/', 'http://mokup.local')
  const method = req.method ?? 'GET'
  const headers = buildHeaders(req.headers)
  const init: RequestInit = { method, headers }
  const rawBody = await readRawBody(req)
  if (rawBody && method !== 'GET' && method !== 'HEAD') {
    init.body = rawBody as BodyInit
  }
  return new Request(url.toString(), init)
}

async function sendResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  if (!response.body) {
    res.end()
    return
  }
  const buffer = new Uint8Array(await response.arrayBuffer())
  res.end(buffer)
}

function hasMatch(app: Hono, method: string, pathname: string) {
  const matchMethod = method === 'HEAD' ? 'GET' : method
  const match = app.router.match(matchMethod, pathname)
  return !!match && match[0].length > 0
}

/**
 * Create a Connect-style middleware for Vite/preview servers.
 *
 * @param getApp - Lazy getter for the Hono app.
 * @param logger - Logger for request output.
 * @returns Node middleware handler.
 *
 * @example
 * import { createMiddleware } from 'mokup/vite'
 *
 * const middleware = createMiddleware(() => null, console)
 */
export function createMiddleware(
  getApp: () => Hono | null,
  logger: Logger,
) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ) => {
    const app = getApp()
    if (!app) {
      return next()
    }

    const url = req.url ?? '/'
    const parsedUrl = new URL(url, 'http://mokup.local')
    const pathname = parsedUrl.pathname
    const method = normalizeMethod(req.method) ?? 'GET'

    if (!hasMatch(app, method, pathname)) {
      return next()
    }

    const startedAt = Date.now()
    try {
      const response = await app.fetch(await toRequest(req))
      if (res.writableEnded) {
        return
      }
      await sendResponse(res, response)
      logger.info(`${method} ${pathname} ${Date.now() - startedAt}ms`)
    }
    catch (error) {
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      }
      res.end('Mock handler error')
      logger.error('Mock handler failed:', error)
    }
  }
}
