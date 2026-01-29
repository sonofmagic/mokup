import type { RouteConfigInfo, RouteIgnoreInfo, RouteSkipInfo } from '@mokup/core'
import type { RouteTable } from '../../shared/types'

function buildRouteSignature(
  routes: RouteTable,
  disabledRoutes: RouteSkipInfo[],
  ignoredRoutes: RouteIgnoreInfo[],
  configFiles: RouteConfigInfo[],
  disabledConfigFiles: RouteConfigInfo[],
) {
  return routes
    .map(route =>
      [
        route.method,
        route.template,
        route.file,
        typeof route.handler === 'function' ? 'handler' : 'static',
        route.status ?? '',
        route.delay ?? '',
      ].join('|'),
    )
    .concat(
      disabledRoutes.map(route =>
        [
          route.reason,
          route.file,
          route.method ?? '',
          route.url ?? '',
          JSON.stringify(route.decisionChain ?? []),
          JSON.stringify(route.effectiveConfig ?? {}),
        ].join('|'),
      ),
    )
    .concat(
      ignoredRoutes.map(route =>
        [
          route.reason,
          route.file,
          JSON.stringify(route.decisionChain ?? []),
          JSON.stringify(route.effectiveConfig ?? {}),
        ].join('|'),
      ),
    )
    .concat(
      configFiles.map(route => route.file),
    )
    .concat(
      disabledConfigFiles.map(route => route.file),
    )
    .join('\n')
}

export { buildRouteSignature }
