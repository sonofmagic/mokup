import './axios-augment'

export { applyMokupToAxios, createAxiosRequestInterceptor } from './adapters/axios'
export type { AxiosAdapterOptions, AxiosInstanceLike, AxiosRequestConfig } from './adapters/axios'

export { createFetchAdapter } from './adapters/fetch'
export type { FetchAdapterOptions, MokupFetchInit } from './adapters/fetch'

export { createMockResolver } from './core'
export type {
  MockResolver,
  MockResolverOptions,
  RequestDescriptor,
  ResolveResult,
} from './core'
