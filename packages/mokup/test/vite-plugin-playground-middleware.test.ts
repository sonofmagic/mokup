import type { IncomingMessage, ServerResponse } from 'node:http'
import { describe, expect, it, vi } from 'vitest'
import { createMokupPlugin } from '../src/vite/plugin'

const serverHooks = vi.hoisted(() => ({
  configureDevServer: vi.fn(),
  configurePreviewServer: vi.fn(),
}))

vi.mock('../src/vite/plugin/server-hooks', () => serverHooks)

describe('vite plugin playground middleware', () => {
  it('serves playground index and uses getters', async () => {
    const plugin = createMokupPlugin({
      entries: { dir: '/root/mock', prefix: '/api' },
      playground: true,
    })

    plugin.configResolved?.({
      root: '/root',
      base: '/',
      command: 'serve',
      build: { outDir: 'dist', assetsDir: 'assets', ssr: false },
    } as any)

    const server = {
      config: { root: '/root', base: '/' },
      ws: {},
    }
    await plugin.configureServer?.(server as any)

    const params = serverHooks.configureDevServer.mock.calls[0]?.[0]
    const playgroundMiddleware = params.playgroundMiddleware as (
      req: IncomingMessage,
      res: ServerResponse,
      next: (err?: unknown) => void,
    ) => Promise<void>

    const state = {
      body: '',
      statusCode: 0,
    }
    const res = {
      setHeader: vi.fn(),
      end: (chunk?: string | Uint8Array) => {
        state.body = typeof chunk === 'string' ? chunk : ''
      },
      get statusCode() {
        return state.statusCode
      },
      set statusCode(value: number) {
        state.statusCode = value
      },
    } as unknown as ServerResponse

    let nextCalled = false
    await playgroundMiddleware(
      { url: '/__mokup/routes' } as IncomingMessage,
      res,
      () => {
        nextCalled = true
      },
    )

    expect(nextCalled).toBe(false)
    expect(state.body).toContain('routes')

    state.body = ''
    nextCalled = false
    await playgroundMiddleware(
      { url: '/__mokup/index.html' } as IncomingMessage,
      res,
      () => {
        nextCalled = true
      },
    )

    expect(nextCalled).toBe(false)
    expect(state.body).toContain('mokup-playground')
  })
})
