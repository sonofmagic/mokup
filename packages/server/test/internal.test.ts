import { PassThrough } from 'node:stream'
import { describe, expect, it } from 'vitest'
import {
  applyRuntimeResultToNode,
  normalizeHeaders,
  normalizeNodeHeaders,
  normalizeQuery,
  parseBody,
  resolveUrl,
  toArrayBuffer,
  toRuntimeRequestFromFetch,
  toRuntimeRequestFromNode,
} from '../src/internal'

describe('server internal helpers', () => {
  it('normalizes query and headers', () => {
    const params = new URLSearchParams('a=1&a=2&b=3')
    expect(normalizeQuery(params)).toEqual({ a: ['1', '2'], b: '3' })

    const headers = new Headers({ 'Content-Type': 'application/json', 'X-Test': '1' })
    expect(normalizeHeaders(headers)).toEqual({
      'content-type': 'application/json',
      'x-test': '1',
    })

    expect(
      normalizeNodeHeaders({ 'X-Test': '1', 'Set-Cookie': ['a', 'b'], 'Skip': undefined }),
    ).toEqual({ 'x-test': '1', 'set-cookie': 'a,b' })
  })

  it('parses bodies based on content type', () => {
    expect(parseBody('', 'application/json')).toBeUndefined()
    expect(parseBody('{"ok":true}', 'application/json')).toEqual({ ok: true })
    expect(parseBody('{"ok":true}', 'application/ld+json')).toEqual({ ok: true })
    expect(parseBody('a=1&b=2', 'application/x-www-form-urlencoded')).toEqual({
      a: '1',
      b: '2',
    })
    expect(parseBody('raw', 'text/plain')).toBe('raw')
  })

  it('returns ArrayBuffer copies when needed', () => {
    const direct = new Uint8Array([1, 2, 3])
    expect(toArrayBuffer(direct)).toBe(direct.buffer)

    const sliced = direct.subarray(1, 3)
    const buffer = toArrayBuffer(sliced)
    expect(buffer).not.toBe(direct.buffer)
    expect(Array.from(new Uint8Array(buffer))).toEqual([2, 3])
  })

  it('resolves URLs using headers or defaults', () => {
    expect(resolveUrl('https://example.com/ok', { host: 'ignored' }).href)
      .toBe('https://example.com/ok')

    expect(resolveUrl('/api', { host: 'example.com' }).href)
      .toBe('http://example.com/api')

    expect(resolveUrl('/api', {}).href)
      .toBe('http://localhost/api')
  })

  it('creates runtime requests from fetch', async () => {
    const request = new Request('http://example.com/api?x=1&x=2', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"ok":true}',
    })
    const runtime = await toRuntimeRequestFromFetch(request)
    expect(runtime.path).toBe('/api')
    expect(runtime.query).toEqual({ x: ['1', '2'] })
    expect(runtime.body).toEqual({ ok: true })
    expect(runtime.rawBody).toBe('{"ok":true}')
  })

  it('creates runtime requests from node streams', async () => {
    const stream = new PassThrough()
    const req = Object.assign(stream, {
      method: 'POST',
      url: '/api?x=1',
      headers: { 'content-type': 'application/json', 'host': 'example.com' },
    })

    const runtimePromise = toRuntimeRequestFromNode(req)
    stream.end('{"ok":true}')
    const runtime = await runtimePromise

    expect(runtime.path).toBe('/api')
    expect(runtime.query).toEqual({ x: '1' })
    expect(runtime.body).toEqual({ ok: true })
    expect(runtime.rawBody).toBe('{"ok":true}')
  })

  it('applies runtime results to node responses', () => {
    const headers: Record<string, string> = {}
    let body: unknown
    const res = {
      statusCode: 0,
      setHeader: (name: string, value: string) => {
        headers[name] = value
      },
      end: (data?: string | Uint8Array | ArrayBuffer | null) => {
        body = data ?? null
      },
    }

    applyRuntimeResultToNode(res, {
      status: 201,
      headers: { 'x-test': '1' },
      body: 'ok',
    })

    expect(res.statusCode).toBe(201)
    expect(headers['x-test']).toBe('1')
    expect(body).toBe('ok')
  })
})
