import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Logger, MockContext, MockRequest, RouteTable } from './types'

import { Buffer } from 'node:buffer'
import { matchRouteTokens } from '@mokup/runtime'
import { delay, normalizeMethod } from './utils'

function extractQuery(parsedUrl: URL) {
  const query: Record<string, string | string[]> = {}
  for (const [key, value] of parsedUrl.searchParams.entries()) {
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
  return query
}

async function readRawBody(req: IncomingMessage) {
  return new Promise<Buffer | null>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
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

async function readRequestBody(req: IncomingMessage, parsedUrl: URL) {
  const query = extractQuery(parsedUrl)
  const rawBody = await readRawBody(req)
  if (!rawBody) {
    return { query, body: undefined, rawBody: undefined }
  }
  const rawText = rawBody.toString('utf8')
  const contentType = (req.headers['content-type'] || '').split(';')[0].trim()
  if (contentType === 'application/json' || contentType.endsWith('+json')) {
    try {
      return { query, body: JSON.parse(rawText), rawBody: rawText }
    }
    catch {
      return { query, body: rawText, rawBody: rawText }
    }
  }
  if (contentType === 'application/x-www-form-urlencoded') {
    const params = new URLSearchParams(rawText)
    const body = Object.fromEntries(params.entries())
    return { query, body, rawBody: rawText }
  }
  return { query, body: rawText, rawBody: rawText }
}

function applyHeaders(res: ServerResponse, headers?: Record<string, string>) {
  if (!headers) {
    return
  }
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value)
  }
}

function writeResponse(res: ServerResponse, body: unknown) {
  if (typeof body === 'undefined') {
    if (!res.headersSent && res.statusCode === 200) {
      res.statusCode = 204
    }
    res.end()
    return
  }
  if (Buffer.isBuffer(body)) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/octet-stream')
    }
    res.end(body)
    return
  }
  if (typeof body === 'string') {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    }
    res.end(body)
    return
  }
  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
  }
  res.end(JSON.stringify(body))
}

function findMatchingRoute(
  routes: RouteTable,
  method: string,
  pathname: string,
) {
  for (const route of routes) {
    if (route.method !== method) {
      continue
    }
    const matched = matchRouteTokens(route.tokens, pathname)
    if (matched) {
      return { route, params: matched.params }
    }
  }
  return null
}

export function createMiddleware(
  getRoutes: () => RouteTable,
  logger: Logger,
) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ) => {
    const url = req.url ?? '/'
    const parsedUrl = new URL(url, 'http://mokup.local')
    const pathname = parsedUrl.pathname
    const method = normalizeMethod(req.method) ?? 'GET'
    const matched = findMatchingRoute(getRoutes(), method, pathname)
    if (!matched) {
      return next()
    }

    try {
      const { query, body, rawBody } = await readRequestBody(req, parsedUrl)
      const mockReq: MockRequest = {
        url: pathname,
        method,
        headers: req.headers,
        query,
        body,
        rawBody,
        params: matched.params,
      }
      const ctx: MockContext = {
        delay: (ms: number) => delay(ms),
        json: (data: unknown) => data,
      }

      const startedAt = Date.now()
      const responseValue
        = typeof matched.route.response === 'function'
          ? await matched.route.response(mockReq, res, ctx)
          : matched.route.response
      if (res.writableEnded) {
        return
      }

      if (matched.route.delay && matched.route.delay > 0) {
        await delay(matched.route.delay)
      }

      applyHeaders(res, matched.route.headers)
      if (matched.route.status) {
        res.statusCode = matched.route.status
      }
      writeResponse(res, responseValue)
      logger.info(`${method} ${pathname} ${Date.now() - startedAt}ms`)
    }
    catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Mock handler error')
      logger.error('Mock handler failed:', error)
    }
  }
}
