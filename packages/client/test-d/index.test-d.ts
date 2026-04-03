/* eslint-disable antfu/no-import-dist */
import type { AxiosAdapterOptions as AxiosSubpathOptions } from '../dist/axios.mjs'
import type {
  AxiosAdapterOptions,
  AxiosInstanceLike,
  AxiosRequestConfig,
  FetchAdapterOptions,
  MockResolver,
  MockResolverOptions,
  MokupFetchInit,
  RequestDescriptor,
  ResolveResult,
} from '../dist/index.mjs'
import { expectAssignable, expectType } from 'tsd'
import { createFetchAdapter as createFetchAdapterFromSubpath } from '../dist/fetch.mjs'
import {
  applyMokupToAxios,
  createAxiosRequestInterceptor,
  createFetchAdapter,
  createMockResolver,
} from '../dist/index.mjs'

const resolverOptions: MockResolverOptions = {
  mockBase: 'http://localhost:3300',
  realBase: 'https://api.example.com',
  pathMap: [{ from: '/api/*', to: '/*' }],
  allowHosts: ['api.example.com'],
  markers: {
    header: true,
    query: true,
  },
  env: {
    useMock: 'true',
  },
  storage: {
    get: () => true,
    set: () => {},
  },
}

const resolver = createMockResolver(resolverOptions)
expectType<MockResolver>(resolver)

const request: RequestDescriptor = {
  url: '/api/users',
  method: 'GET',
  headers: {
    'x-test': '1',
  },
  params: {
    page: 1,
  },
  mock: true,
}

const resolved = resolver.resolve(request)
expectType<ResolveResult>(resolved)

const fetchOptions: FetchAdapterOptions = {
  resolver,
}
const fetchAdapter = createFetchAdapter(fetchOptions)
expectType<typeof createFetchAdapterFromSubpath>(createFetchAdapterFromSubpath)
expectAssignable<(input: string | URL | Request, init?: MokupFetchInit) => Promise<Response>>(fetchAdapter)

const axiosOptions: AxiosAdapterOptions = {
  resolver,
}
expectType<AxiosSubpathOptions>(axiosOptions)

const interceptor = createAxiosRequestInterceptor(axiosOptions)
expectAssignable<(config: AxiosRequestConfig) => Promise<AxiosRequestConfig>>(interceptor)

const instance = {
  interceptors: {
    request: {
      use: async (handler: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>) => {
        await handler({ url: '/api/users' })
        return 1
      },
    },
  },
} satisfies AxiosInstanceLike

expectType<void>(applyMokupToAxios(instance, axiosOptions))
