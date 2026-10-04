import { resolveUrl } from './normalize'

const INVALID_HOST_CHARACTERS_RE = /[\\/?#@]/

/** Resolve HTTP request targets without interpreting a leading // as a host. */
export function resolveNodeRequestUrl(input: string, headers: Record<string, string>): URL {
  try {
    const host = headers['host']
    if (host && (INVALID_HOST_CHARACTERS_RE.test(host) || host.trim() !== host)) {
      throw new TypeError('Invalid Host header')
    }
    const base = resolveUrl('/', headers)
    return input.startsWith('/')
      ? new URL(`${base.origin}${input}`)
      : resolveUrl(input, headers)
  }
  catch (cause) {
    throw Object.assign(new Error('Invalid request URL', { cause }), {
      status: 400,
      statusCode: 400,
      expose: true,
    })
  }
}
