import type { MockResponder } from './types'

export class ResponseController implements MockResponder {
  statusCode = 200
  headers = new Map<string, string>()

  setHeader(key: string, value: string) {
    this.headers.set(key.toLowerCase(), value)
  }

  getHeader(key: string) {
    return this.headers.get(key.toLowerCase())
  }

  removeHeader(key: string) {
    this.headers.delete(key.toLowerCase())
  }

  toRecord() {
    const record: Record<string, string> = {}
    for (const [key, value] of this.headers.entries()) {
      record[key] = value
    }
    return record
  }
}

export function normalizeBody(
  body: unknown,
  contentType?: string,
): { body: string | Uint8Array | null, contentType?: string } {
  if (typeof body === 'undefined') {
    return { body: null }
  }
  if (typeof body === 'string') {
    return {
      body,
      contentType: contentType ?? 'text/plain; charset=utf-8',
    }
  }
  if (body instanceof Uint8Array) {
    return {
      body,
      contentType: contentType ?? 'application/octet-stream',
    }
  }
  if (body instanceof ArrayBuffer) {
    return {
      body: new Uint8Array(body),
      contentType: contentType ?? 'application/octet-stream',
    }
  }
  return {
    body: JSON.stringify(body),
    contentType: contentType ?? 'application/json; charset=utf-8',
  }
}

export function decodeBase64(value: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(value)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
  throw new Error('Base64 decoding is not supported in this runtime.')
}

export function finalizeStatus(status: number, body: string | Uint8Array | null) {
  if (status === 200 && body === null) {
    return 204
  }
  return status
}
