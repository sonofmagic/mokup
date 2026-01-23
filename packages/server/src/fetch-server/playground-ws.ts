import type { Hono } from '@mokup/shared/hono'
import type { Server } from 'node:http'
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
interface NodeWebSocketServer {
  on: (event: string, listener: (...args: unknown[]) => void) => void
}
type PlaygroundWsHandler = MiddlewareHandler<any, string, { outputFormat: 'ws' }>

function createPlaygroundWs(playground: ReturnType<typeof resolvePlaygroundOptions>) {
  const routeCounts: RouteCounts = {}
  const wsClients = new Set<{ send: (data: string) => void }>()
  let totalCount = 0
  let wsHandler: PlaygroundWsHandler | undefined
  let injectWebSocket: ((server: NodeWebSocketServer) => void) | undefined

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

  async function setupPlaygroundWebSocket(app: Hono) {
    if (!playground.enabled) {
      return
    }
    try {
      const mod = await import('@hono/node-ws')
      const { createNodeWebSocket } = mod
      const { upgradeWebSocket, injectWebSocket: inject } = createNodeWebSocket({ app })
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
      injectWebSocket = (server) => {
        inject(server as Server)
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
    getInjectWebSocket: () => injectWebSocket,
  }
}

export { createPlaygroundWs }
