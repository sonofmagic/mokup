type RouteCounts = Record<string, number>
interface PlaygroundWsSnapshot {
  type: 'snapshot'
  total: number
  perRoute: RouteCounts
}
interface PlaygroundWsIncrement {
  type: 'increment'
  routeKey: string
  total: number
}

function resolvePlaygroundWsUrl(basePath: string) {
  const trimmed = basePath.trim()
  if (!trimmed) {
    return ''
  }
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const path = normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
  const url = new URL(`${path}/ws`, window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

function parseWsMessage(data: string) {
  try {
    const parsed = JSON.parse(data) as PlaygroundWsSnapshot | PlaygroundWsIncrement
    if (parsed.type === 'snapshot' && parsed.perRoute) {
      return parsed
    }
    if (parsed.type === 'increment' && typeof parsed.routeKey === 'string') {
      return parsed
    }
  }
  catch {
    return null
  }
  return null
}

export type { PlaygroundWsIncrement, PlaygroundWsSnapshot, RouteCounts }
export { parseWsMessage, resolvePlaygroundWsUrl }
