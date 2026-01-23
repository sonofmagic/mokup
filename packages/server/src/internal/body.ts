import type { ReadableStreamLike } from './types'

const textDecoder = new TextDecoder()
const textEncoder = new TextEncoder()

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

export { resolveBody }
