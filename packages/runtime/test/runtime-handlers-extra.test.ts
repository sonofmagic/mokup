import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/runtime/handlers'

describe('runtime handlers extra branches', () => {
  it('builds app from manifest factory and preserves content-type for array buffers', async () => {
    const manifest = {
      version: 1,
      routes: [
        {
          method: 'GET',
          url: '/binary',
          response: { type: 'module', module: 'mock:handler' },
          middleware: [{ module: 'mock:mw' }, { module: 'mock:bad' }],
        },
      ],
    }

    const moduleMap = {
      'mock:handler': {
        default: { handler: () => new ArrayBuffer(2) },
      },
      'mock:mw': {
        default: async (c: { header: (key: string, value: string) => void }, next: () => Promise<void>) => {
          c.header('content-type', 'application/octet-stream')
          await next()
        },
      },
      'mock:bad': {
        default: { middleware: undefined },
      },
    }

    const app = await buildApp({
      manifest: async () => manifest,
      moduleCache: new Map(),
      middlewareCache: new Map(),
      moduleMap,
    })

    const response = await app.fetch(new Request('http://localhost/binary'))
    expect(response.headers.get('content-type')).toBe('application/octet-stream')
    const buffer = await response.arrayBuffer()
    expect(buffer.byteLength).toBe(2)
  })
})
