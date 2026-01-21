import { describe, expect, it } from 'vitest'
import { createRuntime } from '../src/runtime'

describe('runtime error handling', () => {
  it('requires moduleBase for relative module routes', async () => {
    const runtime = createRuntime({
      manifest: {
        version: 1,
        routes: [
          {
            method: 'GET',
            url: '/module',
            response: {
              type: 'module',
              module: './handler.mjs',
            },
          },
        ],
      },
    })

    await expect(runtime.handle({
      method: 'GET',
      path: '/module',
      query: {},
      headers: {},
      body: undefined,
    })).rejects.toThrow('moduleBase is required')
  })
})
