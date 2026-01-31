import type { MockResolver, MockResolverOptions, RequestDescriptor } from '@mokup/client'
import {
  createAxiosRequestInterceptor,
  createFetchAdapter,
  createMockResolver,

} from '@mokup/client'

export type QueryKey = readonly unknown[]

export interface QueryFunctionContext {
  queryKey: QueryKey
  signal?: AbortSignal
  meta?: Record<string, unknown>
}

export type QueryFunction<TData = unknown> = (context: QueryFunctionContext) => Promise<TData>

export type MutationFunction<TData = unknown, TVariables = unknown> = (variables: TVariables) => Promise<TData>

export interface QueryClientLike {
  setDefaultOptions?: (options: {
    queries?: { queryFn?: QueryFunction }
    mutations?: { mutationFn?: MutationFunction }
  }) => void
  getDefaultOptions?: () => {
    queries?: { queryFn?: QueryFunction }
    mutations?: { mutationFn?: MutationFunction }
  }
  defaultOptions?: {
    queries?: { queryFn?: QueryFunction }
    mutations?: { mutationFn?: MutationFunction }
  }
}

export type BuildRequest = (queryKey: QueryKey, meta?: Record<string, unknown>) => RequestDescriptor | null
export type BuildMutationRequest = (variables: unknown) => RequestDescriptor | null

export type RequestExecutor = (
  request: RequestDescriptor,
  context?: { signal?: AbortSignal },
) => Promise<unknown>

export interface FetchExecutorOptions {
  fetch?: typeof fetch
  resolver?: MockResolver
  resolverOptions?: MockResolverOptions
  transformResponse?: (response: Response) => Promise<unknown>
}

export interface AxiosExecutorOptions {
  axios: {
    request: (config: Record<string, unknown>) => Promise<unknown>
  }
  resolver?: MockResolver
  resolverOptions?: MockResolverOptions
  selectResponse?: (response: unknown) => unknown
}

export interface MokupQueryOptions {
  resolver?: MockResolver
  resolverOptions?: MockResolverOptions
  buildRequest?: BuildRequest
  buildMutationRequest?: BuildMutationRequest
  executor?: RequestExecutor
  fetch?: typeof fetch
  transformResponse?: (response: Response) => Promise<unknown>
}

const methodMatch = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRequestDescriptor(value: unknown): value is RequestDescriptor {
  return isRecord(value) && typeof value.url === 'string'
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
  return {
    ...rest,
    url,
    method: normalizeMethod(descriptor.method),
    meta: mergeMeta(descriptor.meta as Record<string, unknown> | undefined, meta),
  }
}

function defaultBuildRequest(queryKey: QueryKey, meta?: Record<string, unknown>): RequestDescriptor | null {
  if (isRecord(meta) && isRequestDescriptor(meta.request)) {
    return meta.request
  }
  if (isRequestDescriptor(queryKey)) {
    return queryKey
  }
  if (!Array.isArray(queryKey) || queryKey.length === 0) {
    return null
  }

  const [first, second, third] = queryKey
  if (typeof first === 'string' && typeof second === 'string') {
    const method = methodMatch.has(first.toUpperCase()) ? first.toUpperCase() : 'GET'
    const extras = isRecord(third) ? third : {}
    return {
      url: second,
      method,
      ...extras,
    }
  }
  if (typeof first === 'string') {
    const extras = isRecord(second) ? second : {}
    return {
      url: first,
      method: 'GET',
      ...extras,
    }
  }
  return null
}

function defaultBuildMutationRequest(variables: unknown): RequestDescriptor | null {
  if (isRequestDescriptor(variables)) {
    return variables
  }
  if (Array.isArray(variables) && variables.length > 0) {
    const [first, second, third] = variables
    if (typeof first === 'string' && typeof second === 'string') {
      const method = methodMatch.has(first.toUpperCase()) ? first.toUpperCase() : 'POST'
      const extras = isRecord(third) ? third : {}
      return {
        url: second,
        method,
        ...extras,
      }
    }
  }
  return null
}

function defaultTransformResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

export function createFetchExecutor(options: FetchExecutorOptions = {}): RequestExecutor {
  const resolver = options.resolver ?? createMockResolver(options.resolverOptions)
  const adapter = createFetchAdapter({
    fetch: options.fetch,
    resolver,
  })
  const transform = options.transformResponse ?? defaultTransformResponse

  return async (descriptor, context) => {
    const normalized = normalizeRequest(descriptor, descriptor.meta as Record<string, unknown> | undefined)
    const response = await adapter(normalized.url, {
      method: normalized.method,
      headers: normalized.headers as HeadersInit | undefined,
      body: normalized.body as BodyInit | null | undefined,
      signal: context?.signal,
      mock: normalized.mock,
      meta: normalized.meta as Record<string, unknown> | undefined,
    })
    return transform(response)
  }
}

export function createAxiosExecutor(options: AxiosExecutorOptions): RequestExecutor {
  const resolver = options.resolver ?? createMockResolver(options.resolverOptions)
  const interceptor = createAxiosRequestInterceptor({ resolver })
  const select = options.selectResponse ?? ((response: unknown) => {
    if (isRecord(response) && 'data' in response) {
      return response.data
    }
    return response
  })

  return async (descriptor, context) => {
    const normalized = normalizeRequest(descriptor, descriptor.meta as Record<string, unknown> | undefined)
    const config = await interceptor({
      url: normalized.url,
      method: normalized.method,
      headers: normalized.headers as Record<string, string> | undefined,
      data: normalized.body,
      mock: normalized.mock,
      meta: normalized.meta as Record<string, unknown> | undefined,
      signal: context?.signal,
    })

    const response = await options.axios.request(config)
    return select(response)
  }
}

export function createMokupQueryClient(options: MokupQueryOptions = {}) {
  const resolver = options.resolver ?? createMockResolver(options.resolverOptions)
  const buildRequest = options.buildRequest ?? defaultBuildRequest
  const buildMutationRequest = options.buildMutationRequest ?? defaultBuildMutationRequest
  const executor = options.executor ?? createFetchExecutor({
    resolver,
    fetch: options.fetch,
    transformResponse: options.transformResponse,
  })

  const queryFn: QueryFunction = async (context) => {
    const request = buildRequest(context.queryKey, context.meta)
    if (!request) {
      throw new Error('Failed to build request from queryKey. Provide buildRequest to customize.')
    }
    return executor({
      ...request,
      meta: mergeMeta(request.meta as Record<string, unknown> | undefined, context.meta),
    }, { signal: context.signal })
  }

  const mutationFn: MutationFunction = async (variables) => {
    const request = buildMutationRequest(variables)
    if (!request) {
      throw new Error('Failed to build request from mutation variables. Provide buildMutationRequest to customize.')
    }
    return executor(request)
  }

  return {
    queryFn,
    mutationFn,
    buildRequest,
    buildMutationRequest,
    executor,
    resolver,
  }
}

export function applyMokupToQueryClient(
  queryClient: QueryClientLike,
  options: MokupQueryOptions = {},
) {
  const mokup = createMokupQueryClient(options)
  const current = queryClient.getDefaultOptions?.() ?? queryClient.defaultOptions ?? {}
  const next = {
    ...current,
    queries: {
      ...(current.queries ?? {}),
      queryFn: mokup.queryFn,
    },
    mutations: {
      ...(current.mutations ?? {}),
      mutationFn: mokup.mutationFn,
    },
  }

  if (queryClient.setDefaultOptions) {
    queryClient.setDefaultOptions(next)
  }
  else {
    queryClient.defaultOptions = next
  }

  return mokup
}
