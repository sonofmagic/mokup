import { describe, expect, it, vi } from 'vitest'
import {
  createConnectMiddleware,
  createExpressMiddleware,
  createFastifyPlugin,
  createKoaMiddleware,
} from '../src/node'

const manifest = {
  version: 1,
  routes: [
    {
      method: 'GET',
      url: '/users',
      response: { type: 'json', body: [{ id: 1 }] },
    },
  ],
}

describe('server adapters', () => {
  it('connect/express middleware handles routes and 404', async () => {
    const connect = createConnectMiddleware({ manifest, onNotFound: 'response' })
    const express = createExpressMiddleware({ manifest, onNotFound: 'response' })

    const req = {
      method: 'GET',
      url: '/users',
      headers: {},
      body: '',
      on: vi.fn(),
    }
    const res = {
      statusCode: 0,
      headers: {} as Record<string, string>,
      setHeader: (name: string, value: string) => {
        res.headers[name.toLowerCase()] = value
      },
      end: vi.fn(),
    }
    const next = vi.fn()

    await connect(req, res, next)
    expect(res.statusCode).toBe(200)
    expect(res.end).toHaveBeenCalled()

    const missingRes = {
      statusCode: 0,
      setHeader: vi.fn(),
      end: vi.fn(),
    }
    await express({ ...req, url: '/missing' }, missingRes, next)
    expect(missingRes.statusCode).toBe(404)
  })

  it('koa middleware maps runtime results', async () => {
    const middleware = createKoaMiddleware({ manifest, onNotFound: 'response' })
    const ctx = {
      req: {
        method: 'GET',
        url: '/users',
        headers: {},
        body: '',
        on: vi.fn(),
      },
      request: {
        headers: {},
      },
      status: 0,
      body: undefined as unknown,
      set: vi.fn(),
    }

    await middleware(ctx, async () => {})
    expect(ctx.status).toBe(200)
    expect(ctx.body).toEqual(JSON.stringify([{ id: 1 }]))
  })

  it('fastify plugin replies with runtime result', async () => {
    const plugin = createFastifyPlugin({ manifest, onNotFound: 'response' })
    let hook: ((request: any, reply: any) => Promise<void>) | undefined
    const instance = {
      addHook: (_name: 'onRequest', handler: typeof hook) => {
        hook = handler
      },
    }

    await plugin(instance)

    const reply = {
      status: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      send: vi.fn(),
    }

    await hook?.({ method: 'GET', url: '/users', headers: {}, body: '', on: vi.fn() }, reply)

    expect(reply.status).toHaveBeenCalledWith(200)
    expect(reply.send).toHaveBeenCalled()
  })
})
