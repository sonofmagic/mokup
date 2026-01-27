import type { ManifestRoute } from '../src/types'
import { describe, expect, it } from 'vitest'
import { applyRouteOverrides, resolveResponse, toRuntimeResult } from '../src/runtime/response'

describe('runtime response helpers', () => {
  it('returns text or binary bodies based on content-type', async () => {
    const textResponse = new Response('hello')
    const textResult = await toRuntimeResult(textResponse)
    expect(textResult.body).toBe('hello')

    const binaryResponse = new Response(new Uint8Array([1, 2, 3]), {
      headers: { 'content-type': 'application/pdf' },
    })
    const binaryResult = await toRuntimeResult(binaryResponse)
    expect(binaryResult.body).toBeInstanceOf(Uint8Array)
    expect(Array.from(binaryResult.body as Uint8Array)).toEqual([1, 2, 3])
  })

  it('returns null body for empty responses', async () => {
    const response = new Response(null, { status: 204 })
    const result = await toRuntimeResult(response)
    expect(result.body).toBeNull()
    expect(result.status).toBe(204)
  })

  it('treats empty content types as text and handles octet-stream', async () => {
    const emptyType = new Response('hello', { headers: { 'content-type': '' } })
    const emptyResult = await toRuntimeResult(emptyType)
    expect(emptyResult.body).toBe('hello')

    const octet = new Response(new Uint8Array([9, 8]), {
      headers: { 'content-type': 'application/octet-stream' },
    })
    const octetResult = await toRuntimeResult(octet)
    expect(octetResult.body).toBeInstanceOf(Uint8Array)
  })

  it('applies route overrides and resolves response fallbacks', () => {
    const base = new Response('ok', { status: 200, headers: { 'x-a': '1' } })
    const route: ManifestRoute = {
      method: 'GET',
      url: '/ping',
      response: { type: 'text', body: 'ok' },
      status: 201,
      headers: { 'x-b': '2' },
    }

    const overridden = applyRouteOverrides(base, route)
    expect(overridden.status).toBe(201)
    expect(overridden.headers.get('x-a')).toBe('1')
    expect(overridden.headers.get('x-b')).toBe('2')

    const same = applyRouteOverrides(base, {
      ...route,
      status: Number.NaN,
      headers: undefined,
    })
    expect(same).toBe(base)

    const resolved = resolveResponse({ res: new Response('wrapped') }, base)
    expect(resolved).toBeInstanceOf(Response)

    const fallback = resolveResponse({ res: 'nope' }, base)
    expect(fallback).toBe(base)
  })
})
