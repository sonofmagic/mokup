import { parseRouteTemplate } from '@mokup/runtime'
import { describe, expect, it } from 'vitest'
import { createHonoApp } from '../src/dev/hono'

describe('dev hono app', () => {
  it('normalizes handler values to responses', async () => {
    const emptyParsed = parseRouteTemplate('/empty')
    const binaryParsed = parseRouteTemplate('/binary')
    const app = createHonoApp([
      {
        file: 'empty.get.ts',
        template: emptyParsed.template,
        method: 'GET',
        tokens: emptyParsed.tokens,
        score: emptyParsed.score,
        handler: () => undefined,
      },
      {
        file: 'binary.get.ts',
        template: binaryParsed.template,
        method: 'GET',
        tokens: binaryParsed.tokens,
        score: binaryParsed.score,
        handler: () => new Uint8Array([1, 2, 3]),
      },
    ])

    const emptyResponse = await app.fetch(new Request('http://localhost/empty'))
    expect(emptyResponse.status).toBe(204)

    const binaryResponse = await app.fetch(new Request('http://localhost/binary'))
    expect(binaryResponse.headers.get('content-type')).toBe('application/octet-stream')
    expect(Array.from(new Uint8Array(await binaryResponse.arrayBuffer()))).toEqual([1, 2, 3])
  })

  it('applies route overrides and delays responses', async () => {
    const parsed = parseRouteTemplate('/override')
    const app = createHonoApp([
      {
        file: 'override.get.ts',
        template: parsed.template,
        method: 'GET',
        tokens: parsed.tokens,
        score: parsed.score,
        handler: () => new Response(null, { status: 204 }),
        headers: { 'x-test': '1' },
        status: 201,
        delay: 1,
      },
    ])

    const response = await app.fetch(new Request('http://localhost/override'))

    expect(response.status).toBe(201)
    expect(response.headers.get('x-test')).toBe('1')
  })
})
