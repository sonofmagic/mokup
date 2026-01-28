import type { HttpMethod, ManifestRoute, RouteToken } from '@mokup/runtime'
import type { DerivedRoute as SharedDerivedRoute } from '@mokup/shared/route-utils'
import type { RouteRule } from './types'

import { compareRouteScore, parseRouteTemplate } from '@mokup/runtime'
import { createRouteUtils } from '@mokup/shared/route-utils'

/**
 * Derived route metadata from a file path.
 *
 * @example
 * import type { DerivedRoute } from '@mokup/cli'
 *
 * const derived: DerivedRoute = {
 *   template: '/users',
 *   method: 'GET',
 *   tokens: [{ type: 'static', value: 'users' }],
 *   score: [4],
 * }
 */
export type DerivedRoute = SharedDerivedRoute<RouteToken>

const routeUtils = createRouteUtils<RouteToken, RouteRule>({
  parseRouteTemplate,
  compareRouteScore,
})

/**
 * Derive a route template and method from a file path.
 *
 * @param file - File path.
 * @param rootDir - Root directory for routing.
 * @param log - Optional logger.
 * @returns Derived route metadata or null when invalid.
 *
 * @example
 * import { deriveRouteFromFile } from '@mokup/cli'
 *
 * const derived = deriveRouteFromFile('mock/ping.get.ts', 'mock')
 */
export function deriveRouteFromFile(
  file: string,
  rootDir: string,
  log?: (message: string) => void,
): DerivedRoute | null {
  return routeUtils.deriveRouteFromFile(file, rootDir, log)
}

/**
 * Resolve a derived route and rule into a manifest entry stub.
 *
 * @param params - Resolution parameters.
 * @param params.rule - Route rule data.
 * @param params.derivedTemplate - Derived template path.
 * @param params.derivedMethod - Derived HTTP method.
 * @param params.prefix - URL prefix to apply.
 * @param params.file - Source file path.
 * @param params.log - Optional logger for warnings.
 * @returns Resolved data or null when invalid.
 *
 * @example
 * import { resolveRule } from '@mokup/cli'
 *
 * const resolved = resolveRule({
 *   rule: { handler: { ok: true } },
 *   derivedTemplate: '/ping',
 *   derivedMethod: 'GET',
 *   prefix: '/api',
 *   file: 'mock/ping.get.ts',
 * })
 */
export interface ResolvedRouteStub {
  method: HttpMethod
  template: string
  tokens: RouteToken[]
  score: number[]
}

export function resolveRule(params: {
  rule: RouteRule
  derivedTemplate: string
  derivedMethod?: HttpMethod
  prefix: string
  file: string
  log?: (message: string) => void
}): ResolvedRouteStub | null {
  return routeUtils.resolveRule<ResolvedRouteStub>({
    rule: params.rule,
    derivedTemplate: params.derivedTemplate,
    derivedMethod: params.derivedMethod,
    prefix: params.prefix,
    file: params.file,
    warn: params.log,
    build: base => ({
      method: base.method as HttpMethod,
      template: base.template,
      tokens: base.tokens,
      score: base.score,
    }),
  })
}

/**
 * Sort manifest routes by method and score.
 *
 * @param routes - Routes to sort in place.
 * @returns Sorted routes.
 *
 * @example
 * import { sortRoutes } from '@mokup/cli'
 *
 * const routes = sortRoutes([])
 */
export function sortRoutes(routes: ManifestRoute[]) {
  return routes.sort((a, b) => {
    if (a.method !== b.method) {
      return a.method.localeCompare(b.method)
    }
    return compareRouteScore(a.score ?? [], b.score ?? [])
  })
}
