import type { Context } from '@mokup/shared/hono'

import type { ResolvedRoute, RouteTable } from './types'
import { Hono, PatternRouter } from '@mokup/shared/hono'
import { delay } from './utils'

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
    const resolved = response ?? c.res
    if (route.delay && route.delay > 0) {
      await delay(route.delay)
    }
    return applyRouteOverrides(resolved, route)
  }
}

function wrapMiddleware(
  handler: (c: Context, next: () => Promise<void>) => Promise<Response | void>,
) {
  return async (c: Context, next: () => Promise<void>) => {
    const response = await handler(c, next)
    return response ?? c.res
  }
}

export function createHonoApp(routes: RouteTable): Hono {
  const app = new Hono({ router: new PatternRouter(), strict: false })

  for (const route of routes) {
    const middlewares = route.middlewares?.map(entry => wrapMiddleware(entry.handle)) ?? []
    app.on(
      route.method,
      toHonoPath(route),
      createFinalizeMiddleware(route),
      ...middlewares,
      createRouteHandler(route),
    )
  }

  return app
}
