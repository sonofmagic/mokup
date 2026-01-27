import { describe, expect, it, vi } from 'vitest'
import { createPlaygroundWs } from '../src/fetch-server/playground-ws'

const wsMocks = vi.hoisted(() => ({ handlers: null as null | { onOpen?: any, onClose?: any, onMessage?: any } }))

vi.mock('@hono/node-ws', () => ({
  createNodeWebSocket: ({ app }: { app: unknown }) => {
    const handlers: { onOpen?: any, onClose?: any, onMessage?: any } = {}
    wsMocks.handlers = handlers
    const upgradeWebSocket = (factory: () => any) => {
      Object.assign(handlers, factory())
      return vi.fn()
    }
    return {
      upgradeWebSocket,
      injectWebSocket: vi.fn(),
      handlers,
      app,
    }
  },
}))

describe('playground websocket server', () => {
  it('registers websocket handlers and broadcasts', async () => {
    const playground = { enabled: true }
    const ws = createPlaygroundWs(playground as any)

    const app = {}
    await ws.setupPlaygroundWebSocket(app as any)

    const handler = ws.getWsHandler()
    expect(handler).toBeDefined()

    const client = { send: vi.fn() }
    const route = { method: 'GET', template: '/ping' }

    const handlers = wsMocks.handlers
    handlers?.onOpen({}, client)

    expect(client.send).toHaveBeenCalled()

    ws.handleRouteResponse(route as any)
    expect(client.send).toHaveBeenCalled()

    handlers?.onClose({}, client)
  })

  it('skips websocket setup when disabled', async () => {
    const ws = createPlaygroundWs({ enabled: false } as any)
    await ws.setupPlaygroundWebSocket({} as any)
    expect(ws.getWsHandler()).toBeUndefined()
  })
})
