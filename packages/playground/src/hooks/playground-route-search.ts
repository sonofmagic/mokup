import type {
  PlaygroundConfigFile,
  PlaygroundDisabledRoute,
  PlaygroundIgnoredRoute,
  PlaygroundRoute,
} from '../types'
import type { SearchToken } from '../utils/search'

function normalizeSearchValue(value?: string) {
  return (value ?? '').toLowerCase()
}

function matchesText(haystack: string, needle: string) {
  return haystack.includes(needle)
}

function matchRouteTokens(route: PlaygroundRoute, tokens: SearchToken[]) {
  const method = normalizeSearchValue(route.method)
  const path = normalizeSearchValue(route.url)
  const file = normalizeSearchValue(route.file)
  const group = normalizeSearchValue(route.groupKey ?? route.group)
  const composite = `${method} ${path} ${file} ${group}`
  return tokens.every((token) => {
    const value = token.value
    switch (token.field) {
      case 'method':
        return matchesText(method, value)
      case 'path':
        return matchesText(path, value)
      case 'file':
        return matchesText(file, value)
      case 'group':
        return matchesText(group, value)
      case 'reason':
        return false
      default:
        return matchesText(composite, value)
    }
  })
}

function matchConfigTokens(entry: PlaygroundConfigFile, tokens: SearchToken[]) {
  const file = normalizeSearchValue(entry.file)
  const group = normalizeSearchValue(entry.groupKey ?? entry.group)
  const composite = `${file} ${group}`
  return tokens.every((token) => {
    const value = token.value
    switch (token.field) {
      case 'file':
        return matchesText(file, value)
      case 'group':
        return matchesText(group, value)
      case 'text':
        return matchesText(composite, value)
      default:
        return false
    }
  })
}

function matchDisabledTokens(route: PlaygroundDisabledRoute, tokens: SearchToken[]) {
  const method = normalizeSearchValue(route.method)
  const path = normalizeSearchValue(route.url)
  const file = normalizeSearchValue(route.file)
  const group = normalizeSearchValue(route.groupKey ?? route.group)
  const reason = normalizeSearchValue(route.reason)
  const composite = `${method} ${path} ${file} ${group} ${reason}`
  return tokens.every((token) => {
    const value = token.value
    switch (token.field) {
      case 'method':
        return matchesText(method, value)
      case 'path':
        return matchesText(path, value)
      case 'file':
        return matchesText(file, value)
      case 'group':
        return matchesText(group, value)
      case 'reason':
        return matchesText(reason, value)
      default:
        return matchesText(composite, value)
    }
  })
}

function matchIgnoredTokens(route: PlaygroundIgnoredRoute, tokens: SearchToken[]) {
  const file = normalizeSearchValue(route.file)
  const group = normalizeSearchValue(route.groupKey ?? route.group)
  const reason = normalizeSearchValue(route.reason)
  const composite = `${file} ${group} ${reason}`
  return tokens.every((token) => {
    const value = token.value
    switch (token.field) {
      case 'file':
        return matchesText(file, value)
      case 'group':
        return matchesText(group, value)
      case 'reason':
        return matchesText(reason, value)
      case 'text':
        return matchesText(composite, value)
      default:
        return false
    }
  })
}

export {
  matchConfigTokens,
  matchDisabledTokens,
  matchIgnoredTokens,
  matchRouteTokens,
}
