import type { RuntimeRule } from './module'
import type { RouteToken } from './router'
import type {
  HttpMethod,
  Manifest,
  ManifestRoute,
  ModuleMap,
  RuntimeOptions,
  RuntimeRequest,
  RuntimeResult,
} from './types'

import { executeRule, loadModuleRule } from './module'
import { delay, mergeHeaders, normalizeMethod } from './normalize'
import {
  decodeBase64,
  finalizeStatus,
  normalizeBody,
  ResponseController,
} from './response'
import {
  compareRouteScore,
  matchRouteTokens,
  parseRouteTemplate,
  scoreRouteTokens,
} from './router'

async function executeRoute(
  route: ManifestRoute,
  req: RuntimeRequest,
  moduleCache: Map<string, RuntimeRule[]>,
  moduleBase?: string | URL,
  moduleMap?: ModuleMap,
): Promise<RuntimeResult> {
  const responder = new ResponseController()
  const ctx = {
    delay,
    json: <T>(data: T) => data,
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
      moduleMap,
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
      return executeRoute(
        entry.route,
        requestWithParams,
        moduleCache,
        options.moduleBase,
        options.moduleMap,
      )
    }
    return null
  }

  return {
    handle,
  }
}
