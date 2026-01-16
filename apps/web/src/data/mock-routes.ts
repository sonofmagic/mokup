import type { AxiosRequestConfig } from 'axios'
import type { HttpMethod } from 'mokup'

export interface RouteSpec {
  id: string
  title: string
  method: HttpMethod
  path: string
  source: string
  description: string
  features: string[]
  request?: {
    query?: Record<string, unknown>
    body?: Record<string, unknown>
    headers?: Record<string, string>
    responseType?: AxiosRequestConfig['responseType']
  }
  expectedStatus?: number
  disabled?: boolean
  note?: string
  group?: string
}

export interface RouteSection {
  id: string
  title: string
  description: string
  routes: RouteSpec[]
}

const coreRoutes: RouteSpec[] = [
  {
    id: 'profile-json',
    title: 'JSON via file suffix',
    method: 'GET',
    path: '/profile',
    source: 'mock/profile.get.json',
    description: 'Plain JSON response derived from file naming.',
    features: ['json', 'suffix-method'],
    group: 'mock',
  },
  {
    id: 'about-jsonc',
    title: 'JSONC with comments',
    method: 'GET',
    path: '/about',
    source: 'mock/about.get.jsonc',
    description: 'JSONC parsing with comments and trailing commas.',
    features: ['jsonc'],
    group: 'mock',
  },
  {
    id: 'users-index',
    title: 'Index route mapping',
    method: 'GET',
    path: '/users',
    source: 'mock/users/index.get.json',
    description: 'Folder index maps to parent path.',
    features: ['index-mapping'],
    group: 'mock',
  },
  {
    id: 'messages-post',
    title: 'POST suffix mapping',
    method: 'POST',
    path: '/messages',
    source: 'mock/messages.post.json',
    description: 'POST method inferred from filename suffix.',
    features: ['suffix-method', 'json'],
    request: {
      body: { channel: 'control', text: 'Pulse check' },
    },
    group: 'mock',
  },
  {
    id: 'login-fn',
    title: 'Function response + body parse',
    method: 'POST',
    path: '/login',
    source: 'mock/login.post.mock.ts',
    description: 'Uses req.body and res.statusCode.',
    features: ['mock-ts', 'body', 'status', 'response-fn'],
    request: {
      body: { username: 'mokup', password: '123456' },
    },
    expectedStatus: 200,
    group: 'mock',
  },
  {
    id: 'search-query',
    title: 'Query + ctx.delay',
    method: 'GET',
    path: '/search',
    source: 'mock/search.get.mock.ts',
    description: 'Reads req.query and uses ctx.delay.',
    features: ['query', 'ctx-delay', 'response-fn'],
    request: {
      query: { q: 'nova', page: 1 },
    },
    group: 'mock',
  },
  {
    id: 'health-string',
    title: 'String response',
    method: 'GET',
    path: '/health',
    source: 'mock/health.get.ts',
    description: 'Returns text/plain from a rule object.',
    features: ['string'],
    group: 'mock',
  },
  {
    id: 'heartbeat-hot',
    title: 'Hot reload file',
    method: 'GET',
    path: '/heartbeat',
    source: 'mock/heartbeat.get.json',
    description: 'Edit this file and re-run to see updates.',
    features: ['hot-update'],
    group: 'mock',
    note: 'Try editing mock/heartbeat.get.json and hit again.',
  },
  {
    id: 'method-override',
    title: 'Method override in rule',
    method: 'PATCH',
    path: '/method-override',
    source: 'mock/method-override.mock.ts',
    description: 'Method set via rule.method.',
    features: ['method-override'],
    request: {
      body: { mode: 'patch' },
    },
    group: 'mock',
  },
]

const extraRoutes: RouteSpec[] = [
  {
    id: 'url-override',
    title: 'URL override',
    method: 'GET',
    path: '/override/target',
    source: 'mock-extra/url-override.mock.ts',
    description: 'URL is overridden in the rule object.',
    features: ['url-override', 'multi-dir'],
    group: 'mock-extra',
  },
  {
    id: 'batch-one',
    title: 'Array rule: first route',
    method: 'GET',
    path: '/batch/one',
    source: 'mock-extra/batch.mock.ts',
    description: 'Default export is an array of rules.',
    features: ['mock-array', 'multi-dir'],
    group: 'mock-extra',
  },
  {
    id: 'batch-two',
    title: 'Array rule: second route',
    method: 'POST',
    path: '/batch/two',
    source: 'mock-extra/batch.mock.ts',
    description: 'Second rule in array using POST + body.',
    features: ['mock-array', 'body', 'multi-dir'],
    request: {
      body: { payload: 'second' },
    },
    group: 'mock-extra',
  },
  {
    id: 'status-headers',
    title: 'Status + headers',
    method: 'GET',
    path: '/status/accepted',
    source: 'mock-extra/status.mock.ts',
    description: 'Returns 202 and custom headers.',
    features: ['status', 'headers', 'multi-dir'],
    expectedStatus: 202,
    group: 'mock-extra',
  },
  {
    id: 'delay',
    title: 'Delay option',
    method: 'GET',
    path: '/delay',
    source: 'mock-extra/delay.get.mock.ts',
    description: 'Uses delay to simulate slow APIs.',
    features: ['delay', 'multi-dir'],
    group: 'mock-extra',
  },
  {
    id: 'binary',
    title: 'Buffer response',
    method: 'GET',
    path: '/binary',
    source: 'mock-extra/binary.get.mock.ts',
    description: 'Sends an octet-stream payload.',
    features: ['buffer', 'headers', 'multi-dir'],
    request: {
      responseType: 'arraybuffer',
    },
    group: 'mock-extra',
  },
]

const filteredRoutes: RouteSpec[] = [
  {
    id: 'excluded',
    title: 'Excluded by pattern',
    method: 'GET',
    path: '/excluded',
    source: 'mock/excluded.disabled.mock.ts',
    description: 'File name matches exclude regex.',
    features: ['exclude'],
    expectedStatus: 404,
    disabled: true,
    note: 'Exclude uses /\\.disabled\\./.',
    group: 'mock',
  },
  {
    id: 'filtered',
    title: 'Filtered by include',
    method: 'GET',
    path: '/filtered',
    source: 'mock-ignored/filtered.get.json',
    description: 'Included dir, but filtered by include rules.',
    features: ['include-filter'],
    expectedStatus: 404,
    disabled: true,
    note: 'Included dirs only: mock + mock-extra.',
    group: 'mock-ignored',
  },
]

export const routeSections: RouteSection[] = [
  {
    id: 'core',
    title: 'Core mocks',
    description: 'Primary mock folder with file-based routing.',
    routes: coreRoutes,
  },
  {
    id: 'extra',
    title: 'Extra mocks',
    description: 'Second mock dir with advanced behaviors.',
    routes: extraRoutes,
  },
  {
    id: 'filters',
    title: 'Filter demos',
    description: 'Include/exclude configuration examples.',
    routes: filteredRoutes,
  },
]

export const allRoutes = routeSections.flatMap(section => section.routes)
