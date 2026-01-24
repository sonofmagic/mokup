import type {
  PlaygroundConfigImpactRoute,
  PlaygroundDisabledRoute,
  PlaygroundIgnoredRoute,
  PlaygroundRoute,
} from '../types'

interface ConfigImpactParams {
  selectedFile?: string
  routes: PlaygroundRoute[]
  disabledRoutes: PlaygroundDisabledRoute[]
  ignoredRoutes: PlaygroundIgnoredRoute[]
}

export function buildConfigImpactRoutes(params: ConfigImpactParams) {
  const { selectedFile, routes, disabledRoutes, ignoredRoutes } = params
  if (!selectedFile) {
    return []
  }
  const matches = (chain?: string[]) => Boolean(chain?.includes(selectedFile))
  const results: PlaygroundConfigImpactRoute[] = []
  for (const route of routes) {
    if (matches(route.configChain)) {
      const entry: PlaygroundConfigImpactRoute = {
        kind: 'active',
        file: route.file,
      }
      if (route.method) {
        entry.method = route.method
      }
      if (route.url) {
        entry.url = route.url
      }
      results.push(entry)
    }
  }
  for (const route of disabledRoutes) {
    if (matches(route.configChain)) {
      const entry: PlaygroundConfigImpactRoute = {
        kind: 'disabled',
        file: route.file,
      }
      if (route.method) {
        entry.method = route.method
      }
      if (route.url) {
        entry.url = route.url
      }
      results.push(entry)
    }
  }
  for (const route of ignoredRoutes) {
    if (matches(route.configChain)) {
      results.push({
        kind: 'ignored',
        file: route.file,
      })
    }
  }
  return results
}
