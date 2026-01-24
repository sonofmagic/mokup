import type { IncomingMessage, ServerResponse } from 'node:http'
import type { RouteTable } from '../src/shared/types'
import { Buffer } from 'node:buffer'
import { EventEmitter } from 'node:events'
import { parseRouteTemplate } from '@mokup/runtime'
import { describe, expect, it, vi } from 'vitest'
import { createHonoApp, createMiddleware } from '../src/core/middleware'

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

  it('passes through when app is missing or has no match', async () => {
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const missingApp = createMiddleware(() => null, logger)

    const req = new EventEmitter() as IncomingMessage
    req.url = '/nope'
    req.method = 'GET'
    req.headers = {}

    const res = { writableEnded: false } as ServerResponse
    const next = vi.fn()

    await missingApp(req, res, next)
    expect(next).toHaveBeenCalled()

    const routes = createRouteTable()
    const app = createHonoApp(routes)
    const middleware = createMiddleware(() => app, logger)

    const unmatchedReq = new EventEmitter() as IncomingMessage
    unmatchedReq.url = '/other'
    unmatchedReq.method = 'GET'
    unmatchedReq.headers = {}

    const nextUnmatched = vi.fn()
    await middleware(unmatchedReq, res, nextUnmatched)
    expect(nextUnmatched).toHaveBeenCalled()
  })

  it('handles handler errors and returns 500', async () => {
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const app = {
      router: {
        match: () => [[{}]],
      },
      fetch: async () => {
        throw new Error('boom')
      },
    } as never
    const middleware = createMiddleware(() => app, logger)

    const req = new EventEmitter() as IncomingMessage
    req.url = '/boom'
    req.method = 'GET'
    req.headers = {}

    const state = {
      body: '',
      statusCode: 0,
      headers: {} as Record<string, string>,
      writableEnded: false,
      headersSent: false,
    }
    const res = {
      setHeader: (name: string, value: string) => {
        state.headers[name] = value
        state.headersSent = true
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
      get headersSent() {
        return state.headersSent
      },
    } as unknown as ServerResponse

    const promise = middleware(req, res, () => undefined)
    req.emit('end')
    await promise

    expect(state.statusCode).toBe(500)
    expect(state.body).toBe('Mock handler error')
    expect(logger.error).toHaveBeenCalled()
  })
})
