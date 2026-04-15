import type { RequestDescriptor } from '@mokup/client'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRequestDescriptor(value: unknown): value is RequestDescriptor {
  return isRecord(value) && typeof value['url'] === 'string'
}

function normalizeMethod(method?: string): string {
  if (!method) {
    return 'GET'
  }
  return method.toUpperCase()
}

function mergeMeta(
  base?: Record<string, unknown>,
  override?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!base && !override) {
    return undefined
  }
  return {
    ...(base ?? {}),
    ...(override ?? {}),
  }
}

function applyParams(url: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) {
    return url
  }
  const hashIndex = url.indexOf('#')
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex)
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex)
  const queryIndex = base.indexOf('?')
  const path = queryIndex === -1 ? base : base.slice(0, queryIndex)
  const query = queryIndex === -1 ? '' : base.slice(queryIndex + 1)
  const searchParams = new URLSearchParams(query)

  for (const [key, rawValue] of Object.entries(params)) {
    if (rawValue === undefined || rawValue === null) {
      continue
    }
    if (Array.isArray(rawValue)) {
      for (const entry of rawValue) {
        if (entry === undefined || entry === null) {
          continue
        }
        searchParams.append(key, String(entry))
      }
      continue
    }
    searchParams.set(key, String(rawValue))
  }

  const nextQuery = searchParams.toString()
  return `${path}${nextQuery ? `?${nextQuery}` : ''}${hash}`
}

function normalizeRequest(descriptor: RequestDescriptor, meta?: Record<string, unknown>): RequestDescriptor {
  const { params, ...rest } = descriptor
  const url = applyParams(descriptor.url, params as Record<string, unknown> | undefined)
  const mergedMeta = mergeMeta(descriptor.meta as Record<string, unknown> | undefined, meta)
  return {
    ...rest,
    url,
    method: normalizeMethod(descriptor.method),
    ...(mergedMeta ? { meta: mergedMeta } : {}),
  }
}

export {
  isRecord,
  isRequestDescriptor,
  normalizeRequest,
}
