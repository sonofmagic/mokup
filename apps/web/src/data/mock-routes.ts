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
    source: 'mock/login.post.ts',
    description: 'Uses c.req.json() and c.status().',
    features: ['mock-ts', 'body', 'status', 'response-fn'],
    request: {
      body: { username: 'mokup', password: '123456' },
    },
    expectedStatus: 200,
    group: 'mock',
  },
  {
    id: 'search-query',
    title: 'Query + handler delay',
    method: 'GET',
    path: '/search',
    source: 'mock/search.get.ts',
    description: 'Reads c.req.query() and uses async delay.',
    features: ['query', 'handler-delay', 'response-fn'],
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
    title: 'Rule handler response',
    method: 'GET',
    path: '/override',
    source: 'mock/override.get.ts',
    description: 'Uses the handler field from a rule object.',
    features: ['rule-handler'],
    group: 'mock',
  },
  {
    id: 'user-detail',
    title: 'Dynamic param',
    method: 'GET',
    path: '/users/42',
    source: 'mock/users/[id].get.ts',
    description: 'Reads c.req.param() from a [id] segment.',
    features: ['dynamic', 'params'],
    group: 'mock',
  },
  {
    id: 'reports-catchall',
    title: 'Catch-all params',
    method: 'GET',
    path: '/reports/2026/q1/summary',
    source: 'mock/reports/[...slug].get.ts',
    description: 'Catch-all captures the rest of the path.',
    features: ['catch-all', 'params'],
    group: 'mock',
  },
  {
    id: 'docs-optional',
    title: 'Optional catch-all',
    method: 'GET',
    path: '/docs',
    source: 'mock/docs/[[...slug]].get.ts',
    description: 'Matches /docs and deeper paths with params.',
    features: ['optional-catch-all', 'params'],
    note: 'Try /docs/guide/intro for a filled slug.',
    group: 'mock',
  },
]

const extraRoutes: RouteSpec[] = [
  {
    id: 'url-override',
    title: 'Nested file routing',
    method: 'GET',
    path: '/override/target',
    source: 'mock-extra/override/target.get.ts',
    description: 'Nested folders map directly to the route path.',
    features: ['nested-route', 'multi-dir'],
    group: 'mock-extra',
  },
  {
    id: 'batch-one',
    title: 'Batch route: first lane',
    method: 'GET',
    path: '/batch/one',
    source: 'mock-extra/batch/one.get.ts',
    description: 'Nested file routing for a multi-dir mock.',
    features: ['nested-route', 'multi-dir'],
    group: 'mock-extra',
  },
  {
    id: 'batch-two',
    title: 'Batch route: second lane',
    method: 'POST',
    path: '/batch/two',
    source: 'mock-extra/batch/two.post.ts',
    description: 'POST body handled by a rule handler.',
    features: ['body', 'response-fn', 'multi-dir'],
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
    source: 'mock-extra/status/accepted.get.ts',
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
    source: 'mock-extra/delay.get.ts',
    description: 'Uses delay to simulate slow APIs.',
    features: ['delay', 'multi-dir'],
    group: 'mock-extra',
  },
  {
    id: 'binary',
    title: 'Buffer response',
    method: 'GET',
    path: '/binary',
    source: 'mock-extra/binary.get.ts',
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
    source: 'mock/_ignored/excluded.get.ts',
    description: 'Path matches exclude regex.',
    features: ['exclude'],
    expectedStatus: 404,
    disabled: true,
    note: 'Exclude uses /\\/mock\\/_ignored\\//.',
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
