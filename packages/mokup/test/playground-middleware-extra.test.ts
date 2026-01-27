import type { IncomingMessage, ServerResponse } from 'node:http'
import { Buffer } from 'node:buffer'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { mimeTypes } from '../src/core/playground/assets'
import { createPlaygroundMiddleware } from '../src/core/playground/middleware'

const assetsMocks = vi.hoisted(() => ({
  resolvePlaygroundDist: vi.fn(),
}))

vi.mock('../src/core/playground/assets', async () => {
  const actual = await vi.importActual<typeof import('../src/core/playground/assets')>('../src/core/playground/assets')
  return { ...actual, resolvePlaygroundDist: assetsMocks.resolvePlaygroundDist }
})

describe('playground middleware extra', () => {
  it('redirects base paths and blocks invalid paths', async () => {
    const distDir = await mkdtemp(join(tmpdir(), 'mokup-playground-dist-'))
    assetsMocks.resolvePlaygroundDist.mockReturnValue(distDir)

    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), log: vi.fn() }
    const middleware = createPlaygroundMiddleware({
      config: { enabled: true, path: '/__mokup' },
      logger,
      getRoutes: () => [],
    })

    const state = { statusCode: 0, body: '', headers: {} as Record<string, string> }
    const res = {
      setHeader: (name: string, value: string) => {
        state.headers[name.toLowerCase()] = value
      },
      end: (chunk?: string) => {
        state.body = chunk ?? ''
      },
      get statusCode() {
        return state.statusCode
      },
      set statusCode(value: number) {
        state.statusCode = value
      },
    } as unknown as ServerResponse

    await middleware({ url: '/__mokup' } as IncomingMessage, res, vi.fn())
    expect(state.statusCode).toBe(302)
    expect(state.headers.location).toBe('/__mokup/')

    state.statusCode = 0
    state.body = ''
    await middleware({ url: '/__mokup/..evil' } as IncomingMessage, res, vi.fn())
    expect(state.statusCode).toBe(400)
    expect(state.body).toBe('Invalid path.')
  })

  it('skips when disabled or path is unrelated', async () => {
    const distDir = await mkdtemp(join(tmpdir(), 'mokup-playground-dist-'))
    assetsMocks.resolvePlaygroundDist.mockReturnValue(distDir)

    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), log: vi.fn() }
    const disabled = createPlaygroundMiddleware({
      config: { enabled: false, path: '/__mokup' },
      logger,
      getRoutes: () => [],
    })

    const nextDisabled = vi.fn()
    await disabled({ url: '/__mokup' } as IncomingMessage, {} as ServerResponse, nextDisabled)
    expect(nextDisabled).toHaveBeenCalled()

    const enabled = createPlaygroundMiddleware({
      config: { enabled: true, path: '/__mokup' },
      logger,
      getRoutes: () => [],
    })

    const nextMissing = vi.fn()
    await enabled({ url: undefined } as IncomingMessage, {} as ServerResponse, nextMissing)
    await enabled({ url: '/other' } as IncomingMessage, {} as ServerResponse, nextMissing)
    expect(nextMissing).toHaveBeenCalled()
  })

  it('serves index with injected scripts and base path matching', async () => {
    const distDir = await mkdtemp(join(tmpdir(), 'mokup-playground-dist-'))
    await writeFile(join(distDir, 'index.html'), '<html><body>hi</body></html>', 'utf8')
    assetsMocks.resolvePlaygroundDist.mockReturnValue(distDir)

    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), log: vi.fn() }
    const middleware = createPlaygroundMiddleware({
      config: { enabled: true, path: '/__mokup' },
      logger,
      getRoutes: () => [],
      getServer: () => ({ config: { base: '/base' }, ws: {} }) as never,
      getSwScript: () => 'console.log("sw")',
    })

    const originalHtml = mimeTypes['.html']
    mimeTypes['.html'] = undefined as unknown as string

    const state = { statusCode: 0, body: '', headers: {} as Record<string, string> }
    const res = {
      setHeader: (name: string, value: string) => {
        state.headers[name.toLowerCase()] = value
      },
      end: (chunk?: string) => {
        state.body = chunk ?? ''
      },
      get statusCode() {
        return state.statusCode
      },
      set statusCode(value: number) {
        state.statusCode = value
      },
    } as unknown as ServerResponse

    try {
      await middleware({ url: '/base/__mokup/' } as IncomingMessage, res, vi.fn())
    }
    finally {
      if (typeof originalHtml === 'string') {
        mimeTypes['.html'] = originalHtml
      }
      else {
        delete mimeTypes['.html']
      }
    }

    expect(state.headers['content-type']).toBe('text/html; charset=utf-8')
    expect(state.body).toContain('mokup-playground-hmr')
    expect(state.body).toContain('mokup-playground-sw')
  })

  it('serves routes with default getters and fallback path matching', async () => {
    const distDir = await mkdtemp(join(tmpdir(), 'mokup-playground-dist-'))
    assetsMocks.resolvePlaygroundDist.mockReturnValue(distDir)

    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), log: vi.fn() }
    const middleware = createPlaygroundMiddleware({
      config: { enabled: true, path: '/__mokup' },
      logger,
      getRoutes: () => [],
      getServer: () => ({ config: { base: '/base' } }) as never,
    })

    const state = { statusCode: 0, body: '', headers: {} as Record<string, string> }
    const res = {
      setHeader: (name: string, value: string) => {
        state.headers[name.toLowerCase()] = value
      },
      end: (chunk?: string) => {
        state.body = chunk ?? ''
      },
      get statusCode() {
        return state.statusCode
      },
      set statusCode(value: number) {
        state.statusCode = value
      },
    } as unknown as ServerResponse

    await middleware({ url: '/__mokup/routes' } as IncomingMessage, res, vi.fn())
    const payload = JSON.parse(state.body) as { basePath: string, groups: unknown[] }
    expect(payload.basePath).toBe('/__mokup')
    expect(payload.groups).toEqual([])
  })

  it('serves assets with fallback content types', async () => {
    const distDir = await mkdtemp(join(tmpdir(), 'mokup-playground-dist-'))
    await writeFile(join(distDir, 'asset.bin'), 'bin', 'utf8')
    assetsMocks.resolvePlaygroundDist.mockReturnValue(distDir)

    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), log: vi.fn() }
    const middleware = createPlaygroundMiddleware({
      config: { enabled: true, path: '/__mokup' },
      logger,
      getRoutes: () => [],
      getServer: () => ({ config: { base: '/base' } }) as never,
    })

    const state = { statusCode: 0, body: '', headers: {} as Record<string, string> }
    const res = {
      setHeader: (name: string, value: string) => {
        state.headers[name.toLowerCase()] = value
      },
      end: (chunk?: string | Uint8Array) => {
        state.body = typeof chunk === 'string' ? chunk : Buffer.from(chunk ?? '').toString('utf8')
      },
      get statusCode() {
        return state.statusCode
      },
      set statusCode(value: number) {
        state.statusCode = value
      },
    } as unknown as ServerResponse

    await middleware({ url: '/base/__mokup/asset.bin' } as IncomingMessage, res, vi.fn())
    expect(state.headers['content-type']).toBe('application/octet-stream')
  })

  it('logs index errors and defers missing assets', async () => {
    const distDir = await mkdtemp(join(tmpdir(), 'mokup-playground-dist-'))
    await mkdir(join(distDir, 'assets'), { recursive: true })
    assetsMocks.resolvePlaygroundDist.mockReturnValue(distDir)

    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), log: vi.fn() }
    const middleware = createPlaygroundMiddleware({
      config: { enabled: true, path: '/__mokup' },
      logger,
      getRoutes: () => [],
    })

    const res = {
      setHeader: vi.fn(),
      end: vi.fn(),
      statusCode: 0,
    } as unknown as ServerResponse

    await middleware({ url: '/__mokup/index.html' } as IncomingMessage, res, vi.fn())
    expect(logger.error).toHaveBeenCalled()

    const next = vi.fn()
    await middleware({ url: '/__mokup/assets/missing.js' } as IncomingMessage, res, next)
    expect(next).toHaveBeenCalled()
  })
})
