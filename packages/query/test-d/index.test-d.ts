/* eslint-disable antfu/no-import-dist */
import type {
  AxiosExecutorOptions,
  BuildMutationRequest,
  BuildRequest,
  MokupQueryOptions,
  MutationFunction,
  QueryClientLike,
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  RequestExecutor,
} from '../dist/index.mjs'
import { expectAssignable, expectType } from 'tsd'
import {
  applyMokupToQueryClient,
  createAxiosExecutor,
  createFetchExecutor,
  createMokupQueryClient,
} from '../dist/index.mjs'

const queryKey = ['GET', '/users'] as const satisfies QueryKey
const queryContext: QueryFunctionContext = {
  queryKey,
  meta: {
    request: {
      url: '/users',
      method: 'GET',
    },
  },
}

expectAssignable<QueryKey>(queryKey)
expectType<QueryFunctionContext>(queryContext)

const fetchExecutor = createFetchExecutor({
  resolverOptions: {
    mockBase: 'http://localhost:3300',
    realBase: 'https://api.example.com',
  },
})
expectType<RequestExecutor>(fetchExecutor)

const axiosExecutorOptions: AxiosExecutorOptions = {
  axios: {
    request: async config => ({ data: config }),
  },
}
const axiosExecutor = createAxiosExecutor(axiosExecutorOptions)
expectType<RequestExecutor>(axiosExecutor)

const buildRequest: BuildRequest = key => ({
  url: String(key[1] ?? '/users'),
  method: 'GET',
})

const buildMutationRequest: BuildMutationRequest = variables => ({
  url: '/users',
  method: 'POST',
  body: variables,
})

const queryOptions: MokupQueryOptions = {
  executor: fetchExecutor,
  buildRequest,
  buildMutationRequest,
}

const mokup = createMokupQueryClient(queryOptions)
expectAssignable<QueryFunction>(mokup.queryFn)
expectAssignable<MutationFunction>(mokup.mutationFn)
expectType<BuildRequest>(mokup.buildRequest)
expectType<BuildMutationRequest>(mokup.buildMutationRequest)
expectType<RequestExecutor>(mokup.executor)

const queryClient: QueryClientLike = {
  defaultOptions: {},
  setDefaultOptions: () => {},
}

const applied = applyMokupToQueryClient(queryClient, queryOptions)
expectType<typeof mokup>(applied)
