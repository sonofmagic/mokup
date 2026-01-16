import type { RouteToken } from './router'
import {
  compareRouteScore,
  matchRouteTokens,
  parseRouteTemplate,
  scoreRouteTokens,
} from './router'

export type HttpMethod
  = | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'OPTIONS'
    | 'HEAD'

export interface Manifest {
  version: 1
  routes: ManifestRoute[]
}

export interface ManifestRoute {
  method: HttpMethod
  url: string
  tokens?: RouteToken[]
  score?: number[]
  source?: string
  status?: number
  headers?: Record<string, string>
  delay?: number
  response: ManifestResponse
}

export type ManifestResponse
  = | {
    type: 'json'
    body: unknown
  }
  | {
    type: 'text'
    body: string
  }
  | {
    type: 'binary'
    body: string
    encoding: 'base64'
  }
  | {
    type: 'module'
    module: string
    exportName?: string
    ruleIndex?: number
  }

export interface RuntimeRequest {
  method: string
  path: string
  query: Record<string, string | string[]>
  headers: Record<string, string>
  body: unknown
  rawBody?: string
  params?: Record<string, string | string[]>
}

export interface RuntimeResult {
  status: number
  headers: Record<string, string>
  body: string | Uint8Array | null
}

export interface MockContext {
  delay: (ms: number) => Promise<void>
  json: <T>(data: T) => T
}

export interface MockResponder {
  statusCode: number
  setHeader: (key: string, value: string) => void
  getHeader: (key: string) => string | undefined
  removeHeader: (key: string) => void
}

export type MockResponseHandler = (
  req: RuntimeRequest,
  res: MockResponder,
  ctx: MockContext,
) => unknown | Promise<unknown>

export interface RuntimeOptions {
  manifest: Manifest | (() => Promise<Manifest>)
  moduleBase?: string | URL
}

interface RuntimeRule {
  url?: string
  method?: string
  response: unknown
  status?: number
  headers?: Record<string, string>
  delay?: number
}

const methodSet = new Set<HttpMethod>([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
])

class ResponseController implements MockResponder {
  statusCode = 200
  headers = new Map<string, string>()

  setHeader(key: string, value: string) {
    this.headers.set(key.toLowerCase(), value)
  }

  getHeader(key: string) {
    return this.headers.get(key.toLowerCase())
  }

  removeHeader(key: string) {
    this.headers.delete(key.toLowerCase())
  }

  toRecord() {
    const record: Record<string, string> = {}
    for (const [key, value] of this.headers.entries()) {
      record[key] = value
    }
    return record
  }
}

function normalizeMethod(method?: string | null): HttpMethod | undefined {
  if (!method) {
    return undefined
  }
  const normalized = method.toUpperCase()
  if (methodSet.has(normalized as HttpMethod)) {
    return normalized as HttpMethod
  }
  return undefined
}

function resolveModuleUrl(modulePath: string, moduleBase?: string | URL) {
  if (/^(?:data|http|https|file):/.test(modulePath)) {
    return modulePath
  }
  if (!moduleBase) {
    throw new Error('moduleBase is required for relative module paths.')
  }
  return new URL(modulePath, moduleBase).href
}

function normalizeRules(value: unknown): RuntimeRule[] {
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value as RuntimeRule[]
  }
  if (typeof value === 'function') {
    return [
      {
        response: value,
      },
    ]
  }
  if (typeof value === 'object') {
    return [value as RuntimeRule]
  }
  return [
    {
      response: value,
    },
  ]
}

function mergeHeaders(
  base: Record<string, string>,
  override?: Record<string, string>,
) {
  if (!override) {
    return base
  }
  return {
    ...base,
    ...override,
  }
}

function normalizeBody(
  body: unknown,
  contentType?: string,
): { body: string | Uint8Array | null, contentType?: string } {
  if (typeof body === 'undefined') {
    return { body: null }
  }
  if (typeof body === 'string') {
    return {
      body,
      contentType: contentType ?? 'text/plain; charset=utf-8',
    }
  }
  if (body instanceof Uint8Array) {
    return {
      body,
      contentType: contentType ?? 'application/octet-stream',
    }
  }
  if (body instanceof ArrayBuffer) {
    return {
      body: new Uint8Array(body),
      contentType: contentType ?? 'application/octet-stream',
    }
  }
  return {
    body: JSON.stringify(body),
    contentType: contentType ?? 'application/json; charset=utf-8',
  }
}

function decodeBase64(value: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(value)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
  throw new Error('Base64 decoding is not supported in this runtime.')
}

function finalizeStatus(status: number, body: string | Uint8Array | null) {
  if (status === 200 && body === null) {
    return 204
  }
  return status
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

async function executeRule(
  rule: RuntimeRule | undefined,
  req: RuntimeRequest,
  responder: MockResponder,
  ctx: MockContext,
) {
  if (!rule) {
    return undefined
  }
  const value = rule.response
  if (typeof value === 'function') {
    const handler = value as MockResponseHandler
    return handler(req, responder, ctx)
  }
  return value
}

async function loadModuleRule(
  response: Extract<ManifestResponse, { type: 'module' }>,
  moduleCache: Map<string, RuntimeRule[]>,
  moduleBase?: string | URL,
) {
  const resolvedUrl = resolveModuleUrl(response.module, moduleBase)
  let rules = moduleCache.get(resolvedUrl)
  if (!rules) {
    const module = await import(resolvedUrl)
    const exportName = response.exportName ?? 'default'
    const exported = module[exportName] ?? module.default ?? module
    rules = normalizeRules(exported)
    moduleCache.set(resolvedUrl, rules)
  }
  if (typeof response.ruleIndex === 'number') {
    return rules[response.ruleIndex]
  }
  return rules[0]
}

async function executeRoute(
  route: ManifestRoute,
  req: RuntimeRequest,
  moduleCache: Map<string, RuntimeRule[]>,
  moduleBase?: string | URL,
): Promise<RuntimeResult> {
  const responder = new ResponseController()
  const ctx: MockContext = {
    delay,
    json: data => data,
  }

  let responseValue: unknown
  let contentType: string | undefined

  if (route.response.type === 'json') {
    responseValue = route.response.body
    contentType = 'application/json; charset=utf-8'
  }
  else if (route.response.type === 'text') {
    responseValue = route.response.body
    contentType = 'text/plain; charset=utf-8'
  }
  else if (route.response.type === 'binary') {
    responseValue = decodeBase64(route.response.body)
    contentType = 'application/octet-stream'
  }
  else {
    const rule = await loadModuleRule(
      route.response,
      moduleCache,
      moduleBase,
    )
    responseValue = await executeRule(rule, req, responder, ctx)
  }

  if (route.delay && route.delay > 0) {
    await delay(route.delay)
  }

  const headers = mergeHeaders(responder.toRecord(), route.headers)
  if (contentType && !headers['content-type']) {
    headers['content-type'] = contentType
  }

  const normalized = normalizeBody(responseValue, headers['content-type'])
  const status = finalizeStatus(
    route.status ?? responder.statusCode,
    normalized.body,
  )

  if (normalized.contentType && !headers['content-type']) {
    headers['content-type'] = normalized.contentType
  }

  return {
    status,
    headers,
    body: normalized.body,
  }
}

export function createRuntime(options: RuntimeOptions) {
  let manifestCache: Manifest | null = null
  let compiledRoutes: Map<HttpMethod, Array<{
    route: ManifestRoute
    tokens: RouteToken[]
    score: number[]
  }>> | null = null
  const moduleCache = new Map<string, RuntimeRule[]>()

  const getManifest = async () => {
    if (!manifestCache) {
      manifestCache
        = typeof options.manifest === 'function'
          ? await options.manifest()
          : options.manifest
    }
    return manifestCache
  }

  const getRouteList = async () => {
    if (compiledRoutes) {
      return compiledRoutes
    }
    const manifest = await getManifest()
    const map = new Map<HttpMethod, Array<{
      route: ManifestRoute
      tokens: RouteToken[]
      score: number[]
    }>>()

    for (const route of manifest.routes) {
      const method = normalizeMethod(route.method) ?? 'GET'
      const parsed = route.tokens
        ? { tokens: route.tokens, score: route.score ?? scoreRouteTokens(route.tokens), errors: [] }
        : parseRouteTemplate(route.url)
      if (parsed.errors.length > 0) {
        continue
      }
      const tokens = route.tokens ?? parsed.tokens
      const score = route.score ?? parsed.score
      const list = map.get(method) ?? []
      list.push({ route, tokens, score })
      map.set(method, list)
    }

    for (const list of map.values()) {
      list.sort((a, b) => compareRouteScore(a.score, b.score))
    }
    compiledRoutes = map
    return compiledRoutes
  }

  const handle = async (req: RuntimeRequest): Promise<RuntimeResult | null> => {
    const method = normalizeMethod(req.method) ?? 'GET'
    const map = await getRouteList()
    const list = map.get(method)
    if (!list || list.length === 0) {
      return null
    }
    for (const entry of list) {
      const matched = matchRouteTokens(entry.tokens, req.path)
      if (!matched) {
        continue
      }
      const requestWithParams: RuntimeRequest = {
        ...req,
        params: matched.params,
      }
      return executeRoute(entry.route, requestWithParams, moduleCache, options.moduleBase)
    }
    return null
  }

  return {
    handle,
  }
}

export type { ParsedRouteTemplate, RouteToken } from './router'
export {
  compareRouteScore,
  matchRouteTokens,
  normalizePathname,
  parseRouteTemplate,
  scoreRouteTokens,
} from './router'
