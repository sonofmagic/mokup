import type {
  Manifest,
  ManifestRoute,
  MokupWorkerBundle,
} from '@mokup/server'
import { createMokupWorker } from '@mokup/server/worker'
import mokupBundle from './.mokup/mokup.bundle.mjs'

interface AssetEnv {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
}

const playgroundBase = '/playground'
const apiPrefix = '/api'
const bundle = mokupBundle as MokupWorkerBundle
const mockHandler = createMokupWorker(bundle).fetch

const playgroundGroups = [{ key: 'mock', label: 'mock' }]

function buildAssetRequest(request: Request, pathname: string) {
  const url = new URL(request.url)
  url.pathname = pathname
  url.search = ''
  return new Request(url.toString(), request)
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

function resolveRouteType(route: ManifestRoute) {
  return route.response.type === 'module' ? 'handler' : 'static'
}

function resolveRouteFile(route: ManifestRoute) {
  return route.source ?? route.url
}

function resolveRouteMiddlewares(route: ManifestRoute) {
  if (!route.middleware || route.middleware.length === 0) {
    return undefined
  }
  return route.middleware.map(entry => entry.module)
}

function toPlaygroundRoute(route: ManifestRoute) {
  const middlewares = resolveRouteMiddlewares(route)
  return {
    method: route.method,
    url: route.url,
    file: resolveRouteFile(route),
    type: resolveRouteType(route),
    status: route.status,
    delay: route.delay,
    middlewareCount: middlewares?.length ?? 0,
    middlewares,
    groupKey: playgroundGroups[0].key,
    group: playgroundGroups[0].label,
  }
}

function buildPlaygroundResponse(manifest: Manifest) {
  return {
    basePath: playgroundBase,
    count: manifest.routes.length,
    groups: playgroundGroups,
    routes: manifest.routes.map(toPlaygroundRoute),
  }
}

export default {
  async fetch(request: Request, env: AssetEnv) {
    const url = new URL(request.url)
    const pathname = url.pathname

    if (pathname.startsWith(apiPrefix)) {
      const response = await mockHandler(request)
      return response ?? new Response('Not Found', { status: 404 })
    }

    if (pathname === `${playgroundBase}/routes`) {
      return jsonResponse(buildPlaygroundResponse(bundle.manifest))
    }

    if (pathname === playgroundBase || pathname === `${playgroundBase}/`) {
      return env.ASSETS.fetch(buildAssetRequest(request, `${playgroundBase}/index.html`))
    }

    const assetResponse = await env.ASSETS.fetch(request)
    if (assetResponse.status !== 404) {
      return assetResponse
    }

    if (pathname.startsWith(`${playgroundBase}/`)) {
      return env.ASSETS.fetch(buildAssetRequest(request, `${playgroundBase}/index.html`))
    }

    return env.ASSETS.fetch(buildAssetRequest(request, '/index.html'))
  },
}
