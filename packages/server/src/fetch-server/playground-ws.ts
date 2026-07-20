import type { WebSocketServerLike } from '@hono/node-server'
import type { resolvePlaygroundOptions } from '../dev/playground'
import type { MiddlewareHandler, ResolvedRoute } from '../dev/types'

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
type PlaygroundWsHandler = MiddlewareHandler<any, string, { outputFormat: 'ws' }>
interface PlaygroundWebSocketOptions {
  server: WebSocketServerLike
}

function createPlaygroundWs(playground: ReturnType<typeof resolvePlaygroundOptions>) {
  const routeCounts: RouteCounts = {}
  const wsClients = new Set<{ send: (data: string) => void }>()
  let totalCount = 0
  let wsHandler: PlaygroundWsHandler | undefined
  let websocket: PlaygroundWebSocketOptions | undefined

  function getRouteKey(route: ResolvedRoute) {
    return `${route.method} ${route.template}`
  }

  function buildSnapshot(): PlaygroundWsSnapshot {
    return {
      type: 'snapshot',
      total: totalCount,
      perRoute: { ...routeCounts },
    }
  }

  function broadcast(payload: PlaygroundWsSnapshot | PlaygroundWsIncrement) {
    if (wsClients.size === 0) {
      return
    }
    const message = JSON.stringify(payload)
    for (const client of wsClients) {
      try {
        client.send(message)
      }
      catch {
        wsClients.delete(client)
      }
    }
  }

  function registerWsClient(client: { send: (data: string) => void }) {
    wsClients.add(client)
    try {
      client.send(JSON.stringify(buildSnapshot()))
    }
    catch {
      wsClients.delete(client)
    }
  }

  function handleRouteResponse(route: ResolvedRoute) {
    const routeKey = getRouteKey(route)
    routeCounts[routeKey] = (routeCounts[routeKey] ?? 0) + 1
    totalCount += 1
    broadcast({ type: 'increment', routeKey, total: totalCount })
  }

  async function setupPlaygroundWebSocket() {
    if (!playground.enabled) {
      return
    }
    try {
      const [{ upgradeWebSocket }, { WebSocketServer }] = await Promise.all([
        import('@hono/node-server'),
        import('ws'),
      ])
      wsHandler = upgradeWebSocket(() => ({
        onOpen: (_event, ws) => {
          registerWsClient(ws)
        },
        onClose: (_event, ws) => {
          wsClients.delete(ws)
        },
        onMessage: () => {
          // ignore client messages
        },
      }))
      websocket = {
        server: new WebSocketServer({ noServer: true }) as unknown as WebSocketServerLike,
      }
    }
    catch {
      // ignore websocket setup failures
    }
  }

  return {
    handleRouteResponse,
    setupPlaygroundWebSocket,
    getWsHandler: () => wsHandler,
    getWebSocketOptions: () => websocket,
  }
}

export { createPlaygroundWs }
