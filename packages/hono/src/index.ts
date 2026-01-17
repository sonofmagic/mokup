import type { RuntimeOptions, RuntimeRequest } from '@mokup/runtime'
import type { Context, ErrorHandler, Hono, MiddlewareHandler, RouterRoute } from 'hono'

import { createRuntime } from '@mokup/runtime'

export interface MokupHonoOptions extends RuntimeOptions {
  onNotFound?: 'next' | 'response'
}

export type MokupHonoBridge = Hono & MiddlewareHandler

function parseBody(rawText: string, contentType: string) {
  if (!rawText) {
    return undefined
  }
  if (contentType === 'application/json' || contentType.endsWith('+json')) {
    try {
      return JSON.parse(rawText)
    }
    catch {
      return rawText
    }
  }
  if (contentType === 'application/x-www-form-urlencoded') {
    const params = new URLSearchParams(rawText)
    return Object.fromEntries(params.entries())
  }
  return rawText
}

async function toRuntimeRequest(c: Context): Promise<RuntimeRequest> {
  const url = new URL(c.req.url)
  const query: Record<string, string | string[]> = {}
  for (const [key, value] of url.searchParams.entries()) {
    const current = query[key]
    if (typeof current === 'undefined') {
      query[key] = value
    }
    else if (Array.isArray(current)) {
      current.push(value)
    }
    else {
      query[key] = [current, value]
    }
  }

  const headers: Record<string, string> = {}
  for (const [key, value] of c.req.raw.headers.entries()) {
    headers[key] = value
  }

  const rawBodyText = await c.req.text()
  const contentType = (headers['content-type'] ?? '').split(';')[0]?.trim() ?? ''
  const parsedBody = parseBody(rawBodyText, contentType)

  const request: RuntimeRequest = {
    method: c.req.method,
    path: url.pathname,
    query,
    headers,
    body: parsedBody,
  }
  if (rawBodyText) {
    request.rawBody = rawBodyText
  }
  return request
}

export function mokup(options: MokupHonoOptions): MokupHonoBridge {
  const runtimeOptions: RuntimeOptions = {
    manifest: options.manifest,
  }
  if (options.moduleBase) {
    runtimeOptions.moduleBase = options.moduleBase
  }
  const runtime = createRuntime(runtimeOptions)

  const middleware: MiddlewareHandler = async (c, next) => {
    const request = await toRuntimeRequest(c)
    const result = await runtime.handle(request)
    if (!result) {
      return options.onNotFound === 'response' ? c.notFound() : next()
    }
    const responseBody = result.body instanceof Uint8Array
      ? new Uint8Array(result.body).buffer
      : result.body
    return new Response(responseBody, {
      status: result.status,
      headers: result.headers,
    })
  }

  const route: RouterRoute = {
    basePath: '',
    path: '*',
    method: 'ALL',
    handler: middleware,
  }

  const bridge = middleware as MiddlewareHandler & {
    routes: RouterRoute[]
    errorHandler?: ErrorHandler
  }
  bridge.routes = [route]
  bridge.errorHandler = undefined

  return bridge as MokupHonoBridge
}
