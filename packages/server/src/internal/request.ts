import type { RuntimeRequest } from '@mokup/runtime'
import type { NodeRequestLike } from './types'
import { parseBody, resolveBody } from './body'
import { normalizeHeaders, normalizeNodeHeaders, normalizeQuery, resolveUrl } from './normalize'

function buildRuntimeRequest(
  url: URL,
  method: string,
  headers: Record<string, string>,
  body: unknown,
  rawBody?: string,
): RuntimeRequest {
  const request: RuntimeRequest = {
    method,
    path: url.pathname,
    query: normalizeQuery(url.searchParams),
    headers,
    body,
  }
  if (rawBody) {
    request.rawBody = rawBody
  }
  return request
}

/**
 * Convert a Fetch Request into a RuntimeRequest.
 *
 * @param request - Fetch request.
 * @returns RuntimeRequest for the runtime engine.
 *
 * @example
 * import { toRuntimeRequestFromFetch } from '@mokup/server'
 *
 * const runtimeRequest = await toRuntimeRequestFromFetch(new Request('http://localhost/api'))
 */
export async function toRuntimeRequestFromFetch(
  request: Request,
): Promise<RuntimeRequest> {
  const url = new URL(request.url)
  const headers = normalizeHeaders(request.headers)
  const contentType = (headers['content-type'] ?? '').split(';')[0]?.trim() ?? ''
  const rawBody = await request.text()
  const body = parseBody(rawBody, contentType)
  return buildRuntimeRequest(
    url,
    request.method,
    headers,
    body,
    rawBody || undefined,
  )
}

/**
 * Convert a Node-style request into a RuntimeRequest.
 *
 * @param req - Node request-like object.
 * @param bodyOverride - Optional body override.
 * @returns RuntimeRequest for the runtime engine.
 *
 * @example
 * import { toRuntimeRequestFromNode } from '@mokup/server'
 *
 * const runtimeRequest = await toRuntimeRequestFromNode({ url: '/api', on: () => {} })
 */
export async function toRuntimeRequestFromNode(
  req: NodeRequestLike,
  bodyOverride?: unknown,
): Promise<RuntimeRequest> {
  const headers = normalizeNodeHeaders(req.headers)
  const contentType = (headers['content-type'] ?? '').split(';')[0]?.trim() ?? ''
  const url = resolveUrl(req.originalUrl ?? req.url ?? '/', headers)
  const resolvedBody = await resolveBody(
    typeof bodyOverride === 'undefined' ? req.body : bodyOverride,
    contentType,
    req,
  )
  return buildRuntimeRequest(
    url,
    req.method ?? 'GET',
    headers,
    resolvedBody.body,
    resolvedBody.rawBody,
  )
}
