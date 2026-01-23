import type { RuntimeOptions, RuntimeRequest, RuntimeResult } from '@mokup/runtime'
import type { ServerOptions } from './types'

const textDecoder = new TextDecoder()
const textEncoder = new TextEncoder()

/**
 * Minimal readable stream shape used by adapters.
 *
 * @example
 * import type { ReadableStreamLike } from '@mokup/server'
 *
 * const stream: ReadableStreamLike = {
 *   on: () => {},
 * }
 */
export interface ReadableStreamLike {
  on: (event: string, listener: (...args: unknown[]) => void) => void
}

/**
 * Minimal Node request shape used by adapters.
 *
 * @example
 * import type { NodeRequestLike } from '@mokup/server'
 *
 * const req: NodeRequestLike = { method: 'GET', url: '/api/ping' }
 */
export interface NodeRequestLike extends ReadableStreamLike {
  method?: string
  url?: string
  originalUrl?: string
  headers?: Record<string, string | string[] | undefined>
  body?: unknown
}

/**
 * Minimal Node response shape used by adapters.
 *
 * @example
 * import type { NodeResponseLike } from '@mokup/server'
 *
 * const res: NodeResponseLike = {
 *   setHeader: () => {},
 *   end: () => {},
 * }
 */
export interface NodeResponseLike {
  statusCode?: number
  setHeader: (name: string, value: string) => void
  end: (data?: string | Uint8Array | ArrayBuffer | null) => void
}

/**
 * Convert server adapter options to runtime options.
 *
 * @param options - Server options.
 * @returns Runtime options.
 *
 * @example
 * import { toRuntimeOptions } from '@mokup/server'
 *
 * const runtime = toRuntimeOptions({ manifest: { version: 1, routes: [] } })
 */
export function toRuntimeOptions(
  options: ServerOptions,
): RuntimeOptions {
  const runtimeOptions: RuntimeOptions = {
    manifest: options.manifest,
  }
  if (typeof options.moduleBase !== 'undefined') {
    runtimeOptions.moduleBase = options.moduleBase
  }
  if (typeof options.moduleMap !== 'undefined') {
    runtimeOptions.moduleMap = options.moduleMap
  }
  return runtimeOptions
}

/**
 * Normalize URLSearchParams into a record.
 *
 * @param params - URLSearchParams instance.
 * @returns Query record.
 *
 * @example
 * import { normalizeQuery } from '@mokup/server'
 *
 * const query = normalizeQuery(new URLSearchParams('a=1&a=2'))
 */
export function normalizeQuery(
  params: URLSearchParams,
): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {}
  for (const [key, value] of params.entries()) {
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

/**
 * Normalize fetch Headers into a lowercase record.
 *
 * @param headers - Headers instance.
 * @returns Header record.
 *
 * @example
 * import { normalizeHeaders } from '@mokup/server'
 *
 * const record = normalizeHeaders(new Headers({ 'X-Test': '1' }))
 */
export function normalizeHeaders(
  headers: Headers,
): Record<string, string> {
  const record: Record<string, string> = {}
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value
  })
  return record
}

/**
 * Normalize Node headers into a lowercase record.
 *
 * @param headers - Node header record.
 * @returns Header record.
 *
 * @example
 * import { normalizeNodeHeaders } from '@mokup/server'
 *
 * const record = normalizeNodeHeaders({ 'X-Test': '1' })
 */
export function normalizeNodeHeaders(
  headers?: Record<string, string | string[] | undefined>,
): Record<string, string> {
  if (!headers) {
    return {}
  }
  const record: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'undefined') {
      continue
    }
    record[key.toLowerCase()] = Array.isArray(value) ? value.join(',') : String(value)
  }
  return record
}

/**
 * Parse raw body text based on content type.
 *
 * @param rawText - Raw body text.
 * @param contentType - Content type string.
 * @returns Parsed body value.
 *
 * @example
 * import { parseBody } from '@mokup/server'
 *
 * const body = parseBody('{\"ok\":true}', 'application/json')
 */
export function parseBody(rawText: string, contentType: string) {
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

function decodeText(data: Uint8Array): string {
  return textDecoder.decode(data)
}

/**
 * Normalize a binary body for runtime output.
 *
 * @param body - Binary data.
 * @returns Binary data.
 *
 * @example
 * import { toBinaryBody } from '@mokup/server'
 *
 * const data = toBinaryBody(new Uint8Array([1, 2]))
 */
export function toBinaryBody(body: Uint8Array): Uint8Array {
  return body
}

/**
 * Convert a Uint8Array to an ArrayBuffer.
 *
 * @param body - Binary data.
 * @returns ArrayBuffer view of the data.
 *
 * @example
 * import { toArrayBuffer } from '@mokup/server'
 *
 * const buffer = toArrayBuffer(new Uint8Array([1, 2]))
 */
export function toArrayBuffer(body: Uint8Array): ArrayBuffer {
  const { buffer, byteOffset, byteLength } = body
  if (
    buffer instanceof ArrayBuffer
    && byteOffset === 0
    && byteLength === buffer.byteLength
  ) {
    return buffer
  }
  const copy = new Uint8Array(byteLength)
  copy.set(body)
  return copy.buffer
}

/**
 * Resolve an input URL using request headers as a base.
 *
 * @param input - Request URL or path.
 * @param headers - Headers with optional host.
 * @returns Resolved URL.
 *
 * @example
 * import { resolveUrl } from '@mokup/server'
 *
 * const url = resolveUrl('/api/ping', { host: 'localhost:3000' })
 */
export function resolveUrl(
  input: string,
  headers: Record<string, string> & { host?: string },
): URL {
  if (/^https?:\/\//.test(input)) {
    return new URL(input)
  }
  const host = headers.host
  const base = host ? `http://${host}` : 'http://localhost'
  return new URL(input, base)
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  if (chunks.length === 1) {
    return chunks[0] ?? new Uint8Array()
  }
  let totalLength = 0
  for (const chunk of chunks) {
    totalLength += chunk.length
  }
  const merged = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }
  return merged
}

async function readStreamBody(
  stream: ReadableStreamLike,
): Promise<Uint8Array | null> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    let hasData = false
    stream.on('data', (chunk: unknown) => {
      hasData = true
      if (typeof chunk === 'string') {
        chunks.push(textEncoder.encode(chunk))
        return
      }
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk)
        return
      }
      if (chunk instanceof ArrayBuffer) {
        chunks.push(new Uint8Array(chunk))
        return
      }
      chunks.push(textEncoder.encode(String(chunk)))
    })
    stream.on('end', () => {
      if (!hasData) {
        resolve(null)
        return
      }
      resolve(concatChunks(chunks))
    })
    stream.on('error', (error) => {
      reject(error)
    })
  })
}

async function resolveBody(
  body: unknown,
  contentType: string,
  stream?: ReadableStreamLike,
): Promise<{ body: unknown, rawBody?: string }> {
  if (typeof body !== 'undefined') {
    if (typeof body === 'string') {
      return {
        body: parseBody(body, contentType),
        rawBody: body,
      }
    }
    if (body instanceof Uint8Array) {
      const rawText = decodeText(body)
      return {
        body: parseBody(rawText, contentType),
        rawBody: rawText,
      }
    }
    if (body instanceof ArrayBuffer) {
      const rawText = decodeText(new Uint8Array(body))
      return {
        body: parseBody(rawText, contentType),
        rawBody: rawText,
      }
    }
    return {
      body,
    }
  }

  if (!stream) {
    return { body: undefined }
  }

  const rawBytes = await readStreamBody(stream)
  if (!rawBytes || rawBytes.length === 0) {
    return { body: undefined }
  }
  const rawText = decodeText(rawBytes)
  return {
    body: parseBody(rawText, contentType),
    rawBody: rawText,
  }
}

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

/**
 * Apply a RuntimeResult to a Node response-like object.
 *
 * @param res - Node response-like object.
 * @param result - Runtime result to apply.
 *
 * @example
 * import { applyRuntimeResultToNode } from '@mokup/server'
 *
 * applyRuntimeResultToNode({ setHeader: () => {}, end: () => {} }, {
 *   status: 200,
 *   headers: {},
 *   body: 'ok',
 * })
 */
export function applyRuntimeResultToNode(
  res: NodeResponseLike,
  result: RuntimeResult,
) {
  res.statusCode = result.status
  for (const [key, value] of Object.entries(result.headers)) {
    res.setHeader(key, value)
  }
  if (result.body === null) {
    res.end()
    return
  }
  if (typeof result.body === 'string') {
    res.end(result.body)
    return
  }
  res.end(toBinaryBody(result.body))
}
