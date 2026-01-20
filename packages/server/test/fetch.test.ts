import { describe, expect, it } from 'vitest'
import { createFetchHandler } from '../src/fetch'

const manifest = {
  version: 1,
  routes: [
    {
      method: 'GET',
      url: '/hello',
      response: {
        type: 'json',
        body: { ok: true },
      },
    },
  ],
} as const

describe('fetch handler', () => {
  it('returns matched responses', async () => {
    const handler = createFetchHandler({ manifest, onNotFound: 'response' })
    const response = await handler(new Request('http://localhost/hello'))

    expect(response).not.toBeNull()
    expect(response?.status).toBe(200)
    await expect(response?.json()).resolves.toEqual({ ok: true })
  })

  it('returns 404 responses when configured', async () => {
    const handler = createFetchHandler({ manifest, onNotFound: 'response' })
    const response = await handler(new Request('http://localhost/missing'))

    expect(response).not.toBeNull()
    expect(response?.status).toBe(404)
  })

  it('returns null when onNotFound is next', async () => {
    const handler = createFetchHandler({ manifest, onNotFound: 'next' })
    const response = await handler(new Request('http://localhost/missing'))

    expect(response).toBeNull()
  })
})
