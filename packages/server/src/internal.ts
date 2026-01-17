import type { RuntimeOptions, RuntimeRequest, RuntimeResult } from '@mokup/runtime'
import type { MokupServerOptions } from './types'

const textDecoder = new TextDecoder()
const textEncoder = new TextEncoder()

export interface ReadableStreamLike {
  on: (event: string, listener: (...args: unknown[]) => void) => void
}

export interface NodeRequestLike extends ReadableStreamLike {
  method?: string
  url?: string
  originalUrl?: string
  headers?: Record<string, string | string[] | undefined>
  body?: unknown
}

export interface NodeResponseLike {
  statusCode?: number
  setHeader: (name: string, value: string) => void
  end: (data?: string | Uint8Array | ArrayBuffer | null) => void
}

export function toRuntimeOptions(
  options: MokupServerOptions,
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

export function normalizeHeaders(
  headers: Headers,
): Record<string, string> {
  const record: Record<string, string> = {}
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value
  })
  return record
}

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

export function toBinaryBody(body: Uint8Array): Uint8Array {
  return body
}

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
