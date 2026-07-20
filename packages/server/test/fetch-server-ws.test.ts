import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { createFetchServer } from '../src/fetch-server'

const wsMocks = vi.hoisted(() => ({
  server: null as unknown,
}))

vi.mock('@hono/node-server', () => ({
  upgradeWebSocket: () => () => new Response('ok'),
}))

vi.mock('ws', () => ({
  WebSocketServer: class MockWebSocketServer {
    options = { noServer: true }

    constructor() {
      wsMocks.server = this
    }
  },
}))

describe('fetch server websocket integration', () => {
  it('exposes websocket options when available', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-fetch-ws-'))
    const mockDir = join(root, 'mock')
    await mkdir(mockDir, { recursive: true })
    await writeFile(join(mockDir, 'ping.get.json'), '{"ok":true}', 'utf8')

    const server = await createFetchServer({
      entries: { dir: mockDir, log: false, watch: false },
      playground: { enabled: true },
    })

    expect(server.websocket?.server).toBe(wsMocks.server)
  })
})
