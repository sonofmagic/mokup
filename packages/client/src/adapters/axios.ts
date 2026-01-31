import type { MockResolver, MockResolverOptions, RequestDescriptor } from '../core'
import { createMockResolver } from '../core'
import { isAbsoluteUrl, joinPaths, mergeHeaders, normalizeHeaders } from '../utils'

export interface AxiosRequestConfig {
  url?: string
  baseURL?: string
  method?: string
  headers?: Record<string, string>
  params?: unknown
  data?: unknown
  mock?: boolean
  meta?: Record<string, unknown>
  signal?: AbortSignal
}

export interface AxiosInstanceLike {
  defaults?: {
    baseURL?: string
  }
  interceptors: {
    request: {
      use: (
        onFulfilled: (
          config: AxiosRequestConfig,
        ) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
      ) => unknown
    }
  }
}

export interface AxiosAdapterOptions {
  resolver?: MockResolver
  resolverOptions?: MockResolverOptions
}

function combineBaseUrl(baseURL: string | undefined, url: string | undefined): string {
  if (!url && baseURL) {
    return baseURL
  }
  if (!url) {
    return ''
  }
  if (isAbsoluteUrl(url)) {
    return url
  }
  if (!baseURL) {
    return url
  }
  if (isAbsoluteUrl(baseURL)) {
    return new URL(url, baseURL).toString()
  }
  const basePath = baseURL.startsWith('/') ? baseURL : `/${baseURL}`
  const path = url.startsWith('/') ? url : `/${url}`
  return joinPaths(basePath, path)
}

export function createAxiosRequestInterceptor(options: AxiosAdapterOptions = {}) {
  const resolver = options.resolver ?? createMockResolver(options.resolverOptions)
  return async (config: AxiosRequestConfig) => {
    const baseURL = config.baseURL
    const resolvedUrl = combineBaseUrl(baseURL, config.url)
    const descriptor: RequestDescriptor = {
      url: resolvedUrl || config.url || baseURL || '',
      method: config.method,
      headers: normalizeHeaders(config.headers),
      mock: config.mock,
      meta: config.meta,
      body: config.data,
    }
    const resolved = resolver.resolve(descriptor)
    const nextHeaders = mergeHeaders(descriptor.headers, resolved.headers)

    return {
      ...config,
      baseURL: '',
      url: resolved.url,
      headers: nextHeaders,
    }
  }
}

export function applyMokupToAxios(instance: AxiosInstanceLike, options: AxiosAdapterOptions = {}) {
  const defaultBaseURL = instance.defaults?.baseURL
  const interceptor = createAxiosRequestInterceptor(options)
  instance.interceptors.request.use(async (config) => {
    const mergedConfig = {
      ...config,
      baseURL: config.baseURL ?? defaultBaseURL,
    }
    return interceptor(mergedConfig)
  })
}
