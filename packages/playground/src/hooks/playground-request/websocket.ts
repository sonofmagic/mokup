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

function isPlaygroundWsEnabled() {
  if (import.meta.env.DEV) {
    return true
  }
  const raw = import.meta.env.VITE_MOKUP_PLAYGROUND_WS
  if (!raw) {
    return false
  }
  const normalized = raw.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }
  return false
}

function resolvePlaygroundWsUrl(basePath: string) {
  if (!isPlaygroundWsEnabled()) {
    return ''
  }
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
