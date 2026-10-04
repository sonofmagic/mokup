import { PassThrough } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { createConnectMiddleware } from '../src/connect'
import { createExpressMiddleware } from '../src/express'
import { createFastifyPlugin } from '../src/fastify'
import { toRuntimeRequestFromNode } from '../src/internal'
import { createKoaMiddleware } from '../src/koa'

const manifest = { version: 1 as const, routes: [] }

function request(url = '/') {
  return { method: 'GET', url, headers: {}, body: '', on: vi.fn() }
}

function response() {
  return { statusCode: 0, setHeader: vi.fn(), end: vi.fn() }
}

describe('HTTP request URL validation', () => {
  it.each([
    '[',
    'example.com/route',
    'user@example.com',
    'example.com?query',
    'example.com#fragment',
    'example.com\\route',
    ' example.com',
    'example.com ',
  ])('marks malformed Host %j as a bad request', async (host) => {
    await expect(toRuntimeRequestFromNode({ ...request(), headers: { host } }))
      .rejects
      .toMatchObject({
        message: 'Invalid request URL',
        status: 400,
        statusCode: 400,
        expose: true,
        cause: expect.any(Error),
      })
  })

  it.each(['http://[', 'https://['])('marks malformed absolute target %j as a bad request', async (url) => {
    await expect(toRuntimeRequestFromNode(request(url)))
      .rejects
      .toMatchObject({ status: 400, statusCode: 400 })
  })

  it.each(['//[', '//example.com/users', '/ordinary'])('preserves origin-form path %j', async (path) => {
    const result = await toRuntimeRequestFromNode(request(`${path}?q=1`))
    expect(result.path).toBe(path)
    expect(result.query).toEqual({ q: '1' })
  })

  it.each(['[::1]:3000', 'localhost:8080', 'example.com:80'])('accepts valid Host %j', async (host) => {
    const result = await toRuntimeRequestFromNode({ ...request('/users'), headers: { host } })
    expect(result.path).toBe('/users')
  })
})

describe.each([
  ['Connect', createConnectMiddleware],
  ['Express', createExpressMiddleware],
] as const)('%s adapter error boundaries', (_name, createMiddleware) => {
  it('passes invalid client input to the error handler before loading routes', async () => {
    const loadManifest = vi.fn().mockResolvedValue(manifest)
    const middleware = createMiddleware({ manifest: loadManifest })
    const res = response()
    const next = vi.fn()

    await middleware({ ...request(), headers: { host: '[' } }, res, next)

    expect(next).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ statusCode: 400 }))
    expect(loadManifest).not.toHaveBeenCalled()
    expect(res.end).not.toHaveBeenCalled()
  })

  it('passes application errors through unchanged', async () => {
    const failure = new TypeError('application URL error')
    const middleware = createMiddleware({
      manifest: async () => {
        throw failure
      },
    })
    const next = vi.fn()

    await middleware(request(), response(), next)

    expect(next).toHaveBeenCalledExactlyOnceWith(failure)
    expect(failure).not.toHaveProperty('statusCode')
  })

  it('passes request stream errors through unchanged', async () => {
    const middleware = createMiddleware({ manifest })
    const stream = Object.assign(new PassThrough(), { url: '/', headers: {} })
    const next = vi.fn()
    const pending = middleware(stream, response(), next)
    const failure = new Error('request interrupted')
    stream.destroy(failure)
    await pending

    expect(next).toHaveBeenCalledExactlyOnceWith(failure)
  })

  it('passes response serialization errors to the error handler', async () => {
    const middleware = createMiddleware({
      manifest: {
        version: 1,
        routes: [{ method: 'GET', url: '/', response: { type: 'text', body: 'ok' } }],
      },
    })
    const failure = new Error('response closed')
    const res = response()
    res.end.mockImplementation(() => {
      throw failure
    })
    const next = vi.fn()

    await middleware(request(), res, next)

    expect(next).toHaveBeenCalledExactlyOnceWith(failure)
  })

  it('does not call next twice when downstream middleware throws', async () => {
    const middleware = createMiddleware({ manifest })
    const failure = new Error('downstream failed')
    const next = vi.fn(() => {
      throw failure
    })

    await expect(middleware(request(), response(), next)).rejects.toBe(failure)
    expect(next).toHaveBeenCalledExactlyOnceWith()
  })
})

describe('promise-based adapter errors', () => {
  it('lets Koa handle bad requests and application errors', async () => {
    const middleware = createKoaMiddleware({ manifest })
    const ctx = { req: { ...request(), headers: { host: '[' } }, set: vi.fn() }
    const next = vi.fn()

    await expect(middleware(ctx, next)).rejects.toMatchObject({ status: 400 })
    expect(next).not.toHaveBeenCalled()

    const failure = new Error('manifest failed')
    const failingMiddleware = createKoaMiddleware({
      manifest: async () => {
        throw failure
      },
    })
    await expect(failingMiddleware({ req: request(), set: vi.fn() }, next)).rejects.toBe(failure)
  })

  it('lets Fastify handle bad requests and application errors', async () => {
    type Instance = Parameters<ReturnType<typeof createFastifyPlugin>>[0]
    type Hook = Parameters<Instance['addHook']>[1]
    let hook: Hook | undefined
    const instance: Instance = {
      addHook: (_name, handler) => {
        hook = handler
      },
    }
    const reply = { status: vi.fn().mockReturnThis(), header: vi.fn().mockReturnThis(), send: vi.fn() }
    await createFastifyPlugin({ manifest })(instance)

    await expect(hook?.({ ...request(), headers: { host: '[' } }, reply))
      .rejects
      .toMatchObject({ statusCode: 400 })
    expect(reply.send).not.toHaveBeenCalled()

    const failure = new Error('manifest failed')
    await createFastifyPlugin({
      manifest: async () => {
        throw failure
      },
    })(instance)
    await expect(hook?.(request(), reply)).rejects.toBe(failure)
  })
})
