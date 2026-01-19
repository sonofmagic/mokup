import type { IncomingMessage, ServerResponse } from 'node:http'
import type { RouteTable } from '../src/vite/types'
import { Buffer } from 'node:buffer'
import { EventEmitter } from 'node:events'
import { parseRouteTemplate } from '@mokup/runtime'
import { describe, expect, it } from 'vitest'
import { createHonoApp, createMiddleware } from '../src/vite/middleware'

function createRouteTable(): RouteTable {
  const parsed = parseRouteTemplate('/users/[id]')
  return [
    {
      file: 'users/[id].get.ts',
      template: parsed.template,
      method: 'GET',
      tokens: parsed.tokens,
      score: parsed.score,
      handler: c => ({ id: c.req.param('id') ?? null }),
    },
  ]
}

describe('dev middleware params', () => {
  it('passes params to handlers', async () => {
    const routes = createRouteTable()
    const app = createHonoApp(routes)
    const middleware = createMiddleware(() => app, console)

    const req = new EventEmitter() as IncomingMessage
    req.url = '/users/123'
    req.method = 'GET'
    req.headers = {}

    const state = {
      body: '',
      statusCode: 0,
      headers: {} as Record<string, string>,
      writableEnded: false,
    }
    const res = {
      setHeader: (name: string, value: string) => {
        state.headers[name] = value
      },
      getHeader: (name: string) => state.headers[name],
      end: (chunk?: string | Uint8Array) => {
        if (typeof chunk === 'undefined') {
          state.body = ''
        }
        else {
          state.body = typeof chunk === 'string'
            ? chunk
            : Buffer.from(chunk).toString('utf8')
        }
        state.writableEnded = true
      },
      get statusCode() {
        return state.statusCode
      },
      set statusCode(value: number) {
        state.statusCode = value
      },
      get writableEnded() {
        return state.writableEnded
      },
    } as unknown as ServerResponse

    const promise = middleware(req, res, () => {
      res.statusCode = 404
      res.end('not found')
    })
    req.emit('end')
    await promise

    const data = JSON.parse(state.body)
    expect(data).toEqual({ id: '123' })
  })
})
