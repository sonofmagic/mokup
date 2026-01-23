import type { ManifestRoute, RuntimeResult } from '../types'

function shouldTreatAsText(contentType: string) {
  const normalized = contentType.toLowerCase()
  if (!normalized) {
    return true
  }
  if (
    normalized.startsWith('text/')
    || normalized.includes('json')
    || normalized.includes('xml')
    || normalized.includes('javascript')
  ) {
    return true
  }
  if (
    normalized.startsWith('image/')
    || normalized.startsWith('audio/')
    || normalized.startsWith('video/')
    || normalized.includes('octet-stream')
  ) {
    return false
  }
  if (
    normalized.startsWith('application/')
    && (normalized.includes('pdf') || normalized.includes('zip') || normalized.includes('gzip'))
  ) {
    return false
  }
  return true
}

async function toRuntimeResult(response: Response): Promise<RuntimeResult> {
  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value
  })

  if (!response.body || [204, 205, 304].includes(response.status)) {
    return {
      status: response.status,
      headers,
      body: null,
    }
  }

  const contentType = headers['content-type'] ?? ''
  if (shouldTreatAsText(contentType)) {
    return {
      status: response.status,
      headers,
      body: await response.text(),
    }
  }

  const buffer = new Uint8Array(await response.arrayBuffer())
  return {
    status: response.status,
    headers,
    body: buffer,
  }
}

function isValidStatus(status: unknown): status is number {
  return typeof status === 'number'
    && Number.isFinite(status)
    && status >= 200
    && status <= 599
}

function resolveStatus(routeStatus: number | undefined, responseStatus: number) {
  if (isValidStatus(routeStatus)) {
    return routeStatus
  }
  if (isValidStatus(responseStatus)) {
    return responseStatus
  }
  return 200
}

function applyRouteOverrides(response: Response, route: ManifestRoute) {
  const headers = new Headers(response.headers)
  const hasHeaders = !!route.headers && Object.keys(route.headers).length > 0
  if (route.headers) {
    for (const [key, value] of Object.entries(route.headers)) {
      headers.set(key, value)
    }
  }
  const status = resolveStatus(route.status, response.status)
  if (status === response.status && !hasHeaders) {
    return response
  }
  return new Response(response.body, { status, headers })
}

function resolveResponse(value: unknown, fallback: Response) {
  if (value instanceof Response) {
    return value
  }
  if (value && typeof value === 'object' && 'res' in value) {
    const resolved = (value as { res?: unknown }).res
    if (resolved instanceof Response) {
      return resolved
    }
  }
  return fallback
}

export { applyRouteOverrides, resolveResponse, toRuntimeResult }
