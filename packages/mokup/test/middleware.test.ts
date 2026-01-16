import type { RouteTable } from '../src/vite/types'
import { createServer } from 'node:http'
import { parseRouteTemplate } from '@mokup/runtime'
import { describe, expect, it } from 'vitest'
import { createMiddleware } from '../src/vite/middleware'

function createRouteTable(): RouteTable {
  const parsed = parseRouteTemplate('/users/[id]')
  return [
    {
      file: 'users/[id].get.ts',
      template: parsed.template,
      method: 'GET',
      tokens: parsed.tokens,
      score: parsed.score,
      response: req => ({ id: req.params?.id ?? null }),
    },
  ]
}

describe('dev middleware params', () => {
  it('passes params to handlers', async () => {
    const routes = createRouteTable()
    const middleware = createMiddleware(() => routes, console)

    const server = createServer((req, res) => {
      middleware(req, res, () => {
        res.statusCode = 404
        res.end('not found')
      })
    })

    await new Promise<void>(resolve => server.listen(0, resolve))
    const address = server.address()
    if (!address || typeof address === 'string') {
      server.close()
      throw new Error('Failed to bind test server')
    }

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/users/123`)
      const data = await response.json()
      expect(data).toEqual({ id: '123' })
    }
    finally {
      await new Promise<void>(resolve => server.close(() => resolve()))
    }
  })
})
