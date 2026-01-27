import { Hono } from '@mokup/shared/hono'
import { describe, expect, it } from 'vitest'
import { createHonoMiddleware } from '../src/node'

describe('createHonoMiddleware', () => {
  it('serves manifest routes and returns 404 on missing routes', async () => {
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

    const app = new Hono()
    app.use(createHonoMiddleware({ manifest, onNotFound: 'response' }))

    const ok = await app.fetch(new Request('http://localhost/users'))
    expect(ok.status).toBe(200)
    await expect(ok.json()).resolves.toEqual([{ id: 1 }])

    const missing = await app.fetch(new Request('http://localhost/missing'))
    expect(missing.status).toBe(404)
  })

  it('delegates to next when onNotFound is next', async () => {
    const manifest = { version: 1, routes: [] }
    const middleware = createHonoMiddleware({ manifest })
    let nextCalled = false
    const next = async () => {
      nextCalled = true
      return new Response('next')
    }

    const response = await middleware({ req: { raw: new Request('http://localhost/missing') } } as any, next)
    expect(nextCalled).toBe(true)
    await expect(response?.text()).resolves.toBe('next')
  })
})
