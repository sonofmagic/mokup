import type { ManifestRoute } from '../src/types'
import { describe, expect, it } from 'vitest'
import { routeNeedsModuleBase, toFetchRequest } from '../src/runtime/request'

describe('runtime request helpers', () => {
  it('builds fetch request with query and json body', async () => {
    const request = toFetchRequest({
      method: 'POST',
      path: '/users',
      query: { q: 'test', tags: ['a', 'b'] },
      headers: { 'content-type': 'application/json' },
      body: { ok: true },
    })

    expect(request.method).toBe('POST')
    expect(request.url).toBe('http://mokup.local/users?q=test&tags=a&tags=b')
    await expect(request.text()).resolves.toBe(JSON.stringify({ ok: true }))
  })

  it('prefers rawBody and ignores body for GET requests', async () => {
    const request = toFetchRequest({
      method: 'GET',
      path: '/ping',
      query: {},
      headers: {},
      body: 'ignored',
      rawBody: 'raw',
    })

    expect(request.method).toBe('GET')
    expect(request.body).toBeNull()
    expect(request.url).toBe('http://mokup.local/ping')
  })

  it('supports string and binary bodies', async () => {
    const stringRequest = toFetchRequest({
      method: 'POST',
      path: '/text',
      query: {},
      headers: { 'content-type': 'text/plain' },
      body: 'hello',
    })
    await expect(stringRequest.text()).resolves.toBe('hello')

    const uintRequest = toFetchRequest({
      method: 'POST',
      path: '/bytes',
      query: {},
      headers: {},
      body: new Uint8Array([1, 2, 3]),
    })
    const uintBuffer = new Uint8Array(await uintRequest.arrayBuffer())
    expect(Array.from(uintBuffer)).toEqual([1, 2, 3])

    const arrayRequest = toFetchRequest({
      method: 'POST',
      path: '/buffer',
      query: {},
      headers: {},
      body: new Uint8Array([4, 5, 6]).buffer,
    })
    const arrayBuffer = new Uint8Array(await arrayRequest.arrayBuffer())
    expect(Array.from(arrayBuffer)).toEqual([4, 5, 6])
  })

  it('defaults methods and stringifies objects without json content type', async () => {
    const request = toFetchRequest({
      method: undefined,
      path: '/fallback',
      query: {},
      headers: { 'content-type': 'text/plain' },
      body: { ok: true },
    })

    expect(request.method).toBe('GET')
    expect(request.body).toBeNull()

    const post = toFetchRequest({
      method: 'POST',
      path: '/plain',
      query: {},
      headers: { 'content-type': 'text/plain' },
      body: { ok: true },
    })
    await expect(post.text()).resolves.toBe(JSON.stringify({ ok: true }))
  })

  it('detects routes that need moduleBase', () => {
    const route: ManifestRoute = {
      method: 'GET',
      url: '/users',
      response: {
        type: 'module',
        module: './handlers/users.ts',
      },
    }

    expect(routeNeedsModuleBase(route, undefined)).toBe(true)
    expect(routeNeedsModuleBase(route, { './handlers/users.ts': { default: () => ({ ok: true }) } })).toBe(false)
  })

  it('ignores absolute module paths when checking moduleBase', () => {
    const route: ManifestRoute = {
      method: 'GET',
      url: '/users',
      response: {
        type: 'module',
        module: 'https://example.com/handlers/users.mjs',
      },
    }

    expect(routeNeedsModuleBase(route, undefined)).toBe(false)
  })

  it('checks middleware modules for moduleBase requirements', () => {
    const route: ManifestRoute = {
      method: 'GET',
      url: '/users',
      response: {
        type: 'json',
        body: { ok: true },
      },
      middleware: [{ module: './middleware.mjs' }],
    }

    expect(routeNeedsModuleBase(route, undefined)).toBe(true)
    expect(routeNeedsModuleBase(route, { './middleware.mjs': { default: () => undefined } })).toBe(false)
  })
})
