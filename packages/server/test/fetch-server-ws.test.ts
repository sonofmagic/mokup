import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { createFetchServer } from '../src/fetch-server'

const wsMocks = vi.hoisted(() => ({
  inject: vi.fn(),
}))

vi.mock('@hono/node-ws', () => ({
  createNodeWebSocket: () => ({
    upgradeWebSocket: () => () => new Response('ok'),
    injectWebSocket: wsMocks.inject,
  }),
}))

describe('fetch server websocket integration', () => {
  it('exposes websocket injector when available', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-fetch-ws-'))
    const mockDir = join(root, 'mock')
    await mkdir(mockDir, { recursive: true })
    await writeFile(join(mockDir, 'ping.get.json'), '{"ok":true}', 'utf8')

    const server = await createFetchServer({
      entries: { dir: mockDir, log: false, watch: false },
      playground: { enabled: true },
    })

    expect(server.injectWebSocket).toBeDefined()
    server.injectWebSocket?.({ on: vi.fn() })
    expect(wsMocks.inject).toHaveBeenCalled()
  })
})
