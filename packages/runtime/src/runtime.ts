import type { Context } from '@mokup/shared/hono'
import type { RuntimeRule } from './module'
import type { RouteToken } from './router'

import type {
  HttpMethod,
  Manifest,
  ManifestRoute,
  MiddlewareHandler,
  ModuleMap,
  RuntimeOptions,
  RuntimeRequest,
  RuntimeResult,
} from './types'
import { Hono, PatternRouter } from '@mokup/shared/hono'
import { executeRule, loadModuleMiddleware, loadModuleRule } from './module'
import { delay, normalizeMethod } from './normalize'
import { decodeBase64 } from './response'
import {
  compareRouteScore,
  matchRouteTokens,
  normalizePathname,
  parseRouteTemplate,
  scoreRouteTokens,
} from './router'

interface CompiledRoute {
  route: ManifestRoute
  method: HttpMethod
  tokens: RouteToken[]
  score: number[]
}

function toHonoPath(tokens: RouteToken[]) {
  if (!tokens || tokens.length === 0) {
    return '/'
  }
  const segments = tokens.map((token) => {
    if (token.type === 'static') {
      return token.value
    }
    if (token.type === 'param') {
      return `:${token.name}`
    }
    if (token.type === 'catchall') {
      return `:${token.name}{.+}`
    }
    return `:${token.name}{.+}?`
  })
  return `/${segments.join('/')}`
}

function compileRoutes(manifest: Manifest): CompiledRoute[] {
  const compiled: CompiledRoute[] = []
  for (const route of manifest.routes) {
    const method = normalizeMethod(route.method) ?? 'GET'
    const parsed = route.tokens
      ? {
          tokens: route.tokens,
          score: route.score ?? scoreRouteTokens(route.tokens),
          errors: [] as string[],
        }
      : parseRouteTemplate(route.url)
    if (parsed.errors.length > 0) {
      continue
    }
    compiled.push({
      route,
      method,
      tokens: route.tokens ?? parsed.tokens,
      score: route.score ?? parsed.score,
    })
  }
  return compiled.sort((a, b) => {
    if (a.method !== b.method) {
      return a.method.localeCompare(b.method)
    }
    return compareRouteScore(a.score, b.score)
  })
}

function shouldTreatAsText(contentType: string) {
  const normalized = contentType.toLowerCase()
  if (!normalized) {
    return true
  }
  if (
    normalized.startsWith('text/')
    || normalized.includes('json')
    || normalized.includes('xml')
    || normalized.includes('javascript')
  ) {
    return true
  }
  if (
    normalized.startsWith('image/')
    || normalized.startsWith('audio/')
    || normalized.startsWith('video/')
    || normalized.includes('octet-stream')
  ) {
    return false
  }
  if (
    normalized.startsWith('application/')
    && (normalized.includes('pdf') || normalized.includes('zip') || normalized.includes('gzip'))
  ) {
    return false
  }
  return true
}

async function toRuntimeResult(response: Response): Promise<RuntimeResult> {
  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value
  })

  if (!response.body || [204, 205, 304].includes(response.status)) {
    return {
      status: response.status,
      headers,
      body: null,
    }
  }

  const contentType = headers['content-type'] ?? ''
  if (shouldTreatAsText(contentType)) {
    return {
      status: response.status,
      headers,
      body: await response.text(),
    }
  }

  const buffer = new Uint8Array(await response.arrayBuffer())
  return {
    status: response.status,
    headers,
    body: buffer,
  }
}

function isValidStatus(status: unknown): status is number {
  return typeof status === 'number'
    && Number.isFinite(status)
    && status >= 200
    && status <= 599
}

function resolveStatus(routeStatus: number | undefined, responseStatus: number) {
  if (isValidStatus(routeStatus)) {
    return routeStatus
  }
  if (isValidStatus(responseStatus)) {
    return responseStatus
  }
  return 200
}

function applyRouteOverrides(response: Response, route: ManifestRoute) {
  const headers = new Headers(response.headers)
  const hasHeaders = !!route.headers && Object.keys(route.headers).length > 0
  if (route.headers) {
    for (const [key, value] of Object.entries(route.headers)) {
      headers.set(key, value)
    }
  }
  const status = resolveStatus(route.status, response.status)
  if (status === response.status && !hasHeaders) {
    return response
  }
  return new Response(response.body, { status, headers })
}

function resolveResponse(value: unknown, fallback: Response) {
  if (value instanceof Response) {
    return value
  }
  if (value && typeof value === 'object' && 'res' in value) {
    const resolved = (value as { res?: unknown }).res
    if (resolved instanceof Response) {
      return resolved
    }
  }
  return fallback
}

function normalizeHandlerValue(c: Context, value: unknown): Response {
  if (value instanceof Response) {
    return value
  }
  if (typeof value === 'undefined') {
    const response = c.body(null)
    if (response.status === 200) {
      return new Response(response.body, {
        status: 204,
        headers: response.headers,
      })
    }
    return response
  }
  if (typeof value === 'string') {
    return c.text(value)
  }
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
    if (!c.res.headers.get('content-type')) {
      c.header('content-type', 'application/octet-stream')
    }
    const data = value instanceof ArrayBuffer ? value : new Uint8Array(value)
    return c.body(data)
  }
  return c.json(value)
}

function createRouteHandler(params: {
  route: ManifestRoute
  moduleCache: Map<string, RuntimeRule[]>
  moduleBase?: string | URL
  moduleMap?: ModuleMap
}) {
  const { route, moduleCache, moduleBase, moduleMap } = params

  return async (c: Context) => {
    if (route.response.type === 'json') {
      if (typeof route.response.body === 'undefined') {
        return normalizeHandlerValue(c, undefined)
      }
      return c.json(route.response.body)
    }
    if (route.response.type === 'text') {
      return c.text(route.response.body)
    }
    if (route.response.type === 'binary') {
      const data = new Uint8Array(decodeBase64(route.response.body))
      c.header('content-type', 'application/octet-stream')
      return c.body(data)
    }

    const rule = await loadModuleRule(
      route.response,
      moduleCache,
      moduleBase,
      moduleMap,
    )
    const value = await executeRule(rule, c)
    return normalizeHandlerValue(c, value)
  }
}

function createFinalizeMiddleware(route: ManifestRoute): MiddlewareHandler {
  return async (c, next) => {
    const response = await next()
    const resolved = resolveResponse(response, c.res)
    if (route.delay && route.delay > 0) {
      await delay(route.delay)
    }
    const overridden = applyRouteOverrides(resolved, route)
    c.res = overridden
    return overridden
  }
}

async function buildApp(params: {
  manifest: Manifest
  moduleCache: Map<string, RuntimeRule[]>
  middlewareCache: Map<string, MiddlewareHandler[]>
  moduleBase?: string | URL
  moduleMap?: ModuleMap
}): Promise<Hono> {
  const { manifest, moduleCache, middlewareCache, moduleBase, moduleMap } = params
  const app = new Hono({ router: new PatternRouter(), strict: false })
  const compiled = compileRoutes(manifest)

  for (const entry of compiled) {
    const middlewares: MiddlewareHandler[] = []
    for (const middleware of entry.route.middleware ?? []) {
      const handler = await loadModuleMiddleware(
        middleware,
        middlewareCache,
        moduleBase,
        moduleMap,
      )
      if (handler) {
        middlewares.push(handler)
      }
    }

    const handler = createRouteHandler({
      route: entry.route,
      moduleCache,
      ...(typeof moduleBase !== 'undefined' ? { moduleBase } : {}),
      ...(typeof moduleMap !== 'undefined' ? { moduleMap } : {}),
    })

    app.on(
      entry.method,
      toHonoPath(entry.tokens),
      createFinalizeMiddleware(entry.route),
      ...middlewares,
      handler,
    )
  }

  return app
}

export async function createRuntimeApp(options: RuntimeOptions): Promise<Hono> {
  const manifest = typeof options.manifest === 'function'
    ? await options.manifest()
    : options.manifest
  const moduleCache = new Map<string, RuntimeRule[]>()
  const middlewareCache = new Map<string, MiddlewareHandler[]>()
  return await buildApp({
    manifest,
    moduleCache,
    middlewareCache,
    ...(typeof options.moduleBase !== 'undefined'
      ? { moduleBase: options.moduleBase }
      : {}),
    ...(typeof options.moduleMap !== 'undefined'
      ? { moduleMap: options.moduleMap }
      : {}),
  })
}

function appendQueryParams(url: URL, query: RuntimeRequest['query']) {
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        url.searchParams.append(key, entry)
      }
    }
    else {
      url.searchParams.append(key, value)
    }
  }
}

function resolveRequestBody(req: RuntimeRequest, contentType: string) {
  if (typeof req.rawBody !== 'undefined') {
    return req.rawBody
  }
  const body = req.body
  if (typeof body === 'undefined') {
    return undefined
  }
  if (typeof body === 'string') {
    return body
  }
  if (body instanceof Uint8Array || body instanceof ArrayBuffer) {
    return body
  }
  if (typeof body === 'object') {
    const normalized = contentType.toLowerCase()
    if (normalized.includes('json')) {
      return JSON.stringify(body)
    }
    return JSON.stringify(body)
  }
  return String(body)
}

function toFetchRequest(req: RuntimeRequest): Request {
  const url = new URL(normalizePathname(req.path), 'http://mokup.local')
  appendQueryParams(url, req.query)

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    headers.set(key, value)
  }

  const method = normalizeMethod(req.method) ?? 'GET'
  const contentType = headers.get('content-type') ?? ''
  const body = resolveRequestBody(req, contentType)

  const init: RequestInit = { method, headers }
  if (typeof body !== 'undefined' && method !== 'GET' && method !== 'HEAD') {
    init.body = body as BodyInit
  }

  return new Request(url.toString(), init)
}

function isRelativeModulePath(modulePath: string) {
  return !/^(?:data|http|https|file):/.test(modulePath)
}

function requiresModuleBase(
  modulePath: string,
  moduleMap: ModuleMap | undefined,
) {
  if (!isRelativeModulePath(modulePath)) {
    return false
  }
  if (moduleMap && Object.prototype.hasOwnProperty.call(moduleMap, modulePath)) {
    return false
  }
  return true
}

function routeNeedsModuleBase(route: ManifestRoute, moduleMap: ModuleMap | undefined) {
  if (
    route.response.type === 'module'
    && requiresModuleBase(route.response.module, moduleMap)
  ) {
    return true
  }
  if (route.middleware) {
    for (const middleware of route.middleware) {
      if (requiresModuleBase(middleware.module, moduleMap)) {
        return true
      }
    }
  }
  return false
}

export function createRuntime(options: RuntimeOptions) {
  let manifestCache: Manifest | null = null
  let appPromise: Promise<Hono> | null = null
  let compiledCache: CompiledRoute[] | null = null
  const moduleCache = new Map<string, RuntimeRule[]>()
  const middlewareCache = new Map<string, MiddlewareHandler[]>()

  const getManifest = async () => {
    if (!manifestCache) {
      manifestCache = typeof options.manifest === 'function'
        ? await options.manifest()
        : options.manifest
    }
    return manifestCache
  }

  const getApp = async () => {
    if (!appPromise) {
      appPromise = (async () => {
        const manifest = await getManifest()
        return buildApp({
          manifest,
          moduleCache,
          middlewareCache,
          ...(typeof options.moduleBase !== 'undefined'
            ? { moduleBase: options.moduleBase }
            : {}),
          ...(typeof options.moduleMap !== 'undefined'
            ? { moduleMap: options.moduleMap }
            : {}),
        })
      })()
    }
    return appPromise
  }

  const getCompiled = async () => {
    if (!compiledCache) {
      compiledCache = compileRoutes(await getManifest())
    }
    return compiledCache
  }

  const handle = async (req: RuntimeRequest): Promise<RuntimeResult | null> => {
    const method = normalizeMethod(req.method) ?? 'GET'
    const matchMethod = method === 'HEAD' ? 'GET' : method
    const pathname = normalizePathname(req.path)
    const compiled = await getCompiled()
    let matchedRoute: ManifestRoute | null = null
    for (const entry of compiled) {
      if (entry.method !== matchMethod) {
        continue
      }
      if (matchRouteTokens(entry.tokens, pathname)) {
        matchedRoute = entry.route
        break
      }
    }
    if (!matchedRoute) {
      return null
    }
    if (
      typeof options.moduleBase === 'undefined'
      && routeNeedsModuleBase(matchedRoute, options.moduleMap)
    ) {
      throw new Error('moduleBase is required for relative module paths.')
    }
    const app = await getApp()
    const response = await app.fetch(toFetchRequest(req))
    const resolvedResponse = applyRouteOverrides(response, matchedRoute)
    return await toRuntimeResult(resolvedResponse)
  }

  return {
    handle,
  }
}
