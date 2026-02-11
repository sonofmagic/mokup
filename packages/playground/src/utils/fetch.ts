import type { BuildCurlOptions } from './curl'

function jsString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`
}

function buildFetch(options: BuildCurlOptions): string {
  const method = options.method.toUpperCase()
  const url = new URL(options.url, 'http://localhost')

  if (options.authType === 'apikey' && options.authKeyLocation === 'query' && options.authKeyName && options.authKeyValue) {
    url.searchParams.set(options.authKeyName, options.authKeyValue)
  }

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

  let body: string | undefined
  if (method !== 'GET' && method !== 'HEAD' && options.bodyType !== 'none') {
    const trimmed = options.bodyText.trim()
    if (options.bodyType === 'raw' && trimmed) {
      if (!headers['Content-Type']) {
        headers['Content-Type'] = resolveContentType(options.rawType)
      }
      body = trimmed
    }
    else if (options.bodyType === 'form-urlencoded' && trimmed) {
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
      }
      body = trimmed
    }
  }

  const parts: string[] = [`fetch(${jsString(url.toString())}`, '  {']
  parts.push(`    method: ${jsString(method)},`)

  const headerEntries = Object.entries(headers)
  if (headerEntries.length > 0) {
    parts.push('    headers: {')
    for (const [key, value] of headerEntries) {
      parts.push(`      ${jsString(key)}: ${jsString(value)},`)
    }
    parts.push('    },')
  }

  if (body !== undefined) {
    if (headers['Content-Type'] === 'application/json') {
      parts.push(`    body: JSON.stringify(${body}),`)
    }
    else {
      parts.push(`    body: ${jsString(body)},`)
    }
  }

  parts.push('  }')
  parts.push(')')

  return parts.join('\n')
}

function resolveContentType(rawType: string): string {
  switch (rawType) {
    case 'json': return 'application/json'
    case 'javascript': return 'application/javascript'
    case 'html': return 'text/html'
    case 'xml': return 'text/xml'
    default: return 'text/plain'
  }
}

export { buildFetch }
