import type { AuthType, BodyType, RawBodyType } from '../types'

const SAFE_SHELL_VALUE_PATTERN = /^[\w./:@=&?%-]+$/

function resolveContentType(rawType: RawBodyType): string {
  switch (rawType) {
    case 'json': return 'application/json'
    case 'javascript': return 'application/javascript'
    case 'html': return 'text/html'
    case 'xml': return 'text/xml'
    default: return 'text/plain'
  }
}

function shellEscape(value: string) {
  if (SAFE_SHELL_VALUE_PATTERN.test(value)) {
    return value
  }
  return `'${value.replace(/'/g, `'\\''`)}'`
}

interface BuildCurlOptions {
  method: string
  url: string
  headers: Record<string, string>
  bodyType: BodyType
  rawType: RawBodyType
  bodyText: string
  authType: AuthType
  authToken: string
  authUsername: string
  authPassword: string
  authKeyName: string
  authKeyValue: string
  authKeyLocation: 'header' | 'query'
  authCustomName: string
  authCustomValue: string
}

function buildCurl(options: BuildCurlOptions): string {
  const parts: string[] = ['curl']
  const method = options.method.toUpperCase()

  if (method !== 'GET') {
    parts.push(`-X ${method}`)
  }

  const url = new URL(options.url, 'http://localhost')
  if (options.authType === 'apikey' && options.authKeyLocation === 'query' && options.authKeyName && options.authKeyValue) {
    url.searchParams.set(options.authKeyName, options.authKeyValue)
  }
  parts.push(shellEscape(url.toString()))

  const headers: Record<string, string> = { ...options.headers }

  if (options.authType === 'bearer' && options.authToken) {
    headers['Authorization'] = `Bearer ${options.authToken}`
  }
  else if (options.authType === 'basic' && (options.authUsername || options.authPassword)) {
    headers['Authorization'] = `Basic ${btoa(`${options.authUsername}:${options.authPassword}`)}`
  }
  else if (options.authType === 'apikey' && options.authKeyLocation === 'header' && options.authKeyName && options.authKeyValue) {
    headers[options.authKeyName] = options.authKeyValue
  }
  else if (options.authType === 'custom' && options.authCustomName) {
    headers[options.authCustomName] = options.authCustomValue
  }

  for (const [key, value] of Object.entries(headers)) {
    parts.push(`-H ${shellEscape(`${key}: ${value}`)}`)
  }

  if (method !== 'GET' && method !== 'HEAD' && options.bodyType !== 'none') {
    const trimmed = options.bodyText.trim()
    if (options.bodyType === 'raw' && trimmed) {
      if (!headers['Content-Type']) {
        const ct = resolveContentType(options.rawType)
        parts.push(`-H ${shellEscape(`Content-Type: ${ct}`)}`)
      }
      parts.push(`-d ${shellEscape(trimmed)}`)
    }
    else if (options.bodyType === 'form-urlencoded' && trimmed) {
      if (!headers['Content-Type']) {
        parts.push(`-H ${shellEscape('Content-Type: application/x-www-form-urlencoded')}`)
      }
      parts.push(`--data-urlencode ${shellEscape(trimmed)}`)
    }
    else if (options.bodyType === 'form-data' && trimmed) {
      for (const line of trimmed.split('\n')) {
        const eq = line.indexOf('=')
        if (eq > 0) {
          parts.push(`-F ${shellEscape(line.trim())}`)
        }
      }
    }
  }

  return parts.join(' \\\n  ')
}

export type { BuildCurlOptions }
export { buildCurl }
