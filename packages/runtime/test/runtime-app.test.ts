import { describe, expect, it } from 'vitest'
import { createRuntimeApp } from '../src/runtime'

describe('createRuntimeApp', () => {
  it('builds a Hono app that responds to routes', async () => {
    const app = await createRuntimeApp({
      manifest: {
        version: 1,
        routes: [
          {
            method: 'GET',
            url: '/health',
            response: { type: 'text', body: 'ok' },
          },
        ],
      },
    })

    const response = await app.fetch(new Request('http://localhost/health'))
    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe('ok')
  })
})
