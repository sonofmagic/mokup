import { parseRouteTemplate } from '@mokup/runtime'
import { Hono } from '@mokup/shared/hono'
import { describe, expect, it, vi } from 'vitest'
import { registerPlaygroundRoutes, resolvePlaygroundOptions } from '../src/dev/playground'

describe('dev playground', () => {
  it('normalizes playground options', () => {
    expect(resolvePlaygroundOptions(false)).toEqual({ enabled: false, path: '/_mokup' })
    expect(resolvePlaygroundOptions(true)).toEqual({ enabled: true, path: '/_mokup' })
    expect(resolvePlaygroundOptions({ path: 'custom/', enabled: true }))
      .toEqual({ enabled: true, path: '/custom' })
  })

  it('registers routes and returns playground metadata', async () => {
    const app = new Hono()
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const parsed = parseRouteTemplate('/users/[id]')
    const routes = [
      {
        file: '/tmp/mock/users.get.ts',
        template: parsed.template,
        method: 'GET',
        tokens: parsed.tokens,
        score: parsed.score,
        handler: () => ({ ok: true }),
        middlewares: [
          {
            handle: async (_c: unknown, next: () => Promise<void>) => await next(),
            source: '/tmp/mock/index.config.js',
            index: 0,
          },
        ],
      },
    ]

    registerPlaygroundRoutes({
      app,
      routes,
      disabledRoutes: [
        {
          file: '/tmp/mock/.draft/ignored.get.ts',
          reason: 'ignore-prefix',
          method: 'GET',
          url: '/ignored',
        },
      ],
      dirs: ['/tmp/mock'],
      logger,
      config: resolvePlaygroundOptions({ path: '/_mokup', enabled: true }),
    })

    const response = await app.fetch(new Request('http://localhost/_mokup/routes'))
    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.count).toBe(1)
    expect(data.routes[0]?.url).toBe('/users/[id]')
    expect(data.routes[0]?.middlewareCount).toBe(1)
    expect(data.routes[0]?.group).toBe('mock')
    expect(data.disabled[0]?.url).toBe('/ignored')
    expect(data.disabled[0]?.reason).toBe('ignore-prefix')
  })

  it('skips route registration when playground is disabled', async () => {
    const app = new Hono()
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

    registerPlaygroundRoutes({
      app,
      routes: [],
      dirs: [],
      logger,
      config: resolvePlaygroundOptions(false),
    })

    const response = await app.fetch(new Request('http://localhost/_mokup/routes'))
    expect(response.status).toBe(404)
  })
})
