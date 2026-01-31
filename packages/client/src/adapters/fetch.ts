import type { MockResolver, MockResolverOptions, RequestDescriptor } from '../core'
import { createMockResolver } from '../core'
import { mergeHeaders, normalizeHeaders } from '../utils'

export type MokupFetchInit = RequestInit & {
  mock?: boolean
  meta?: Record<string, unknown>
}

export interface FetchAdapterOptions {
  fetch?: typeof fetch
  resolver?: MockResolver
  resolverOptions?: MockResolverOptions
}

function requestToInit(request: Request, headers: Record<string, string>): RequestInit {
  return {
    method: request.method,
    headers,
    body: request.body,
    cache: request.cache,
    credentials: request.credentials,
    integrity: request.integrity,
    keepalive: request.keepalive,
    mode: request.mode,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    signal: request.signal,
  }
}

export function createFetchAdapter(options: FetchAdapterOptions = {}) {
  const resolver = options.resolver ?? createMockResolver(options.resolverOptions)
  const fetchImpl = options.fetch ?? (typeof fetch !== 'undefined' ? fetch : undefined)

  if (!fetchImpl) {
    throw new Error('fetch is not available in the current runtime.')
  }

  return async function mokupFetch(input: RequestInfo | URL, init?: MokupFetchInit) {
    const hasRequest = typeof Request !== 'undefined' && input instanceof Request
    const sourceRequest = hasRequest ? new Request(input, init) : undefined
    const url = input instanceof URL ? input.toString() : (hasRequest ? sourceRequest!.url : String(input))
    const requestHeaders = sourceRequest ? normalizeHeaders(sourceRequest.headers) : {}
    const initHeaders = normalizeHeaders(init?.headers)
    const mergedHeaders = mergeHeaders(requestHeaders, initHeaders)
    const descriptor: RequestDescriptor = {
      url,
      headers: mergedHeaders,
    }
    const method = sourceRequest?.method ?? init?.method
    if (method) {
      descriptor.method = method
    }
    if (typeof init?.body !== 'undefined' || sourceRequest?.body) {
      descriptor.body = init?.body ?? sourceRequest?.body
    }
    if (typeof init?.mock === 'boolean') {
      descriptor.mock = init.mock
    }
    if (init?.meta) {
      descriptor.meta = init.meta
    }

    const resolved = resolver.resolve(descriptor)
    const nextHeaders = mergeHeaders(descriptor.headers, resolved.headers)
    const { mock: _mock, meta: _meta, ...cleanInit } = init ?? {}

    if (sourceRequest) {
      return fetchImpl(resolved.url, {
        ...requestToInit(sourceRequest, nextHeaders),
        ...cleanInit,
        headers: nextHeaders,
      })
    }

    return fetchImpl(resolved.url, {
      ...cleanInit,
      headers: nextHeaders,
    })
  }
}
