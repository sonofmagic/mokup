import type { Hono } from '@mokup/shared/hono'
import type { RuntimeRule } from './module'
import type { CompiledRoute } from './runtime/routes'
import type {
  Manifest,
  ManifestRoute,
  MiddlewareHandler,
  RuntimeOptions,
  RuntimeRequest,
  RuntimeResult,
} from './types'
import { normalizeMethod } from './normalize'
import { matchRouteTokens, normalizePathname } from './router'
import { buildApp } from './runtime/handlers'
import { routeNeedsModuleBase, toFetchRequest } from './runtime/request'
import { applyRouteOverrides, toRuntimeResult } from './runtime/response'
import { compileRoutes } from './runtime/routes'

/**
 * Build a Hono app from a manifest, loading module handlers as needed.
 *
 * @param options - Runtime options including the manifest.
 * @returns A Hono app with routes registered.
 *
 * @example
 * import { createRuntimeApp } from '@mokup/runtime'
 *
 * const app = await createRuntimeApp({
 *   manifest: { version: 1, routes: [] },
 * })
 */
export async function createRuntimeApp(options: RuntimeOptions): Promise<Hono> {
  const moduleCache = new Map<string, RuntimeRule[]>()
  const middlewareCache = new Map<string, MiddlewareHandler[]>()
  return await buildApp({
    manifest: options.manifest,
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

/**
 * Create a cached runtime handler for fetching and request simulation.
 *
 * @param options - Runtime options including the manifest.
 * @returns Runtime helper with fetch and match helpers.
 *
 * @example
 * import { createRuntime } from '@mokup/runtime'
 *
 * const runtime = createRuntime({
 *   manifest: { version: 1, routes: [] },
 * })
 */
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
