import { describe, expect, it, vi } from 'vitest'
import { createKoaMiddleware } from '../src/koa'

function createCtx(url: string) {
  const req = {
    method: 'GET',
    url,
    headers: {},
    body: null,
    on: vi.fn(),
  }
  const ctx = {
    req,
    set: vi.fn(),
    status: undefined as number | undefined,
    body: undefined as unknown,
  }
  return ctx
}

describe('koa middleware', () => {
  it('handles text and binary responses', async () => {
    const middleware = createKoaMiddleware({
      manifest: {
        version: 1,
        routes: [
          { method: 'GET', url: '/text', response: { type: 'text', body: 'ok' } },
          { method: 'GET', url: '/binary', response: { type: 'binary', body: 'aGVsbG8=', encoding: 'base64' } },
        ],
      },
    })

    const textCtx = createCtx('/text')
    await middleware(textCtx as any, async () => undefined)
    expect(textCtx.status).toBe(200)
    expect(textCtx.body).toBe('ok')
    expect(textCtx.set).toHaveBeenCalled()

    const binaryCtx = createCtx('/binary')
    await middleware(binaryCtx as any, async () => undefined)
    expect(binaryCtx.status).toBe(200)
    expect(binaryCtx.body).toBeInstanceOf(Uint8Array)
  })

  it('handles missing routes based on onNotFound', async () => {
    const onResponse = createKoaMiddleware({
      manifest: { version: 1, routes: [] },
      onNotFound: 'response',
    })
    const responseCtx = createCtx('/missing')
    const next = vi.fn()
    await onResponse(responseCtx as any, next)
    expect(responseCtx.status).toBe(404)
    expect(responseCtx.body).toBeNull()
    expect(next).not.toHaveBeenCalled()

    const onNext = createKoaMiddleware({
      manifest: { version: 1, routes: [] },
      onNotFound: 'next',
    })
    const nextCtx = createCtx('/missing')
    const nextHandler = vi.fn()
    await onNext(nextCtx as any, nextHandler)
    expect(nextHandler).toHaveBeenCalled()
  })
})
