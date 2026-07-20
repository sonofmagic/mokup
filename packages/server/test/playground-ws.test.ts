import { describe, expect, it, vi } from 'vitest'
import { createPlaygroundWs } from '../src/fetch-server/playground-ws'

const wsMocks = vi.hoisted(() => ({
  handlers: null as null | { onOpen?: any, onClose?: any, onMessage?: any },
  server: null as unknown,
}))

vi.mock('@hono/node-server', () => ({
  upgradeWebSocket: (factory: () => any) => {
    const handlers: { onOpen?: any, onClose?: any, onMessage?: any } = {}
    wsMocks.handlers = handlers
    Object.assign(handlers, factory())
    return vi.fn()
  },
}))

vi.mock('ws', () => ({
  WebSocketServer: class MockWebSocketServer {
    options = { noServer: true }

    constructor() {
      wsMocks.server = this
    }
  },
}))

describe('playground websocket server', () => {
  it('registers websocket handlers and broadcasts', async () => {
    const playground = { enabled: true }
    const ws = createPlaygroundWs(playground as any)

    await ws.setupPlaygroundWebSocket()

    const handler = ws.getWsHandler()
    expect(handler).toBeDefined()
    expect(ws.getWebSocketOptions()?.server).toBe(wsMocks.server)

    const client = { send: vi.fn() }
    const route = { method: 'GET', template: '/ping' }

    const handlers = wsMocks.handlers
    handlers?.onOpen({}, client)

    expect(client.send).toHaveBeenCalled()

    ws.handleRouteResponse(route as any)
    expect(client.send).toHaveBeenCalled()

    handlers?.onMessage?.({}, client)
    handlers?.onClose({}, client)
  })

  it('skips websocket setup when disabled', async () => {
    const ws = createPlaygroundWs({ enabled: false } as any)
    await ws.setupPlaygroundWebSocket()
    expect(ws.getWsHandler()).toBeUndefined()
  })
})
