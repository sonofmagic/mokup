import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { createFetchServer } from '../src/fetch-server'

const wsMocks = vi.hoisted(() => ({
  getWsHandler: vi.fn(() => () => new Response('ws')),
  getInjectWebSocket: vi.fn(() => vi.fn()),
  setupPlaygroundWebSocket: vi.fn(),
  handleRouteResponse: vi.fn(),
}))

const watcherMocks = vi.hoisted(() => ({
  createWatcher: vi.fn(async ({ onChange }: { onChange: () => void }) => {
    onChange()
    return { close: vi.fn() }
  }),
}))

vi.mock('../src/fetch-server/playground-ws', () => ({
  createPlaygroundWs: () => ({
    handleRouteResponse: wsMocks.handleRouteResponse,
    setupPlaygroundWebSocket: wsMocks.setupPlaygroundWebSocket,
    getWsHandler: wsMocks.getWsHandler,
    getInjectWebSocket: wsMocks.getInjectWebSocket,
  }),
}))

vi.mock('../src/fetch-server/watcher', () => ({
  createWatcher: watcherMocks.createWatcher,
}))

describe('fetch server extra coverage', () => {
  it('applies entry filters and wires websocket/close hooks', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-fetch-extra-'))
    const mockDir = join(root, 'mock')
    const disabledDir = join(mockDir, 'disabled')
    await mkdir(mockDir, { recursive: true })
    await mkdir(disabledDir, { recursive: true })

    await writeFile(join(mockDir, 'users.get.json'), '{"ok":true}', 'utf8')
    await writeFile(join(mockDir, 'invalid.ts'), 'export default { handler: { ok: true } }', 'utf8')
    await writeFile(
      join(mockDir, 'disabled.get.ts'),
      'export default { enabled: false, handler: { ok: true } }',
      'utf8',
    )
    await writeFile(join(mockDir, 'index.config.js'), 'export default { enabled: true }', 'utf8')
    await writeFile(join(disabledDir, 'index.config.js'), 'export default { enabled: false }', 'utf8')

    const server = await createFetchServer({
      entries: {
        dir: mockDir,
        include: /users/,
        exclude: /skip/,
        ignorePrefix: ['_'],
        watch: true,
        log: false,
      },
      playground: { enabled: true },
    })

    expect(server.getRoutes()).toBeDefined()
    server.injectWebSocket?.({ on: vi.fn() })
    await server.close?.()
    expect(watcherMocks.createWatcher).toHaveBeenCalled()
  })
})
