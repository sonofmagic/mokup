import { describe, expect, it } from 'vitest'
import { createMokupWorker as createWebWorker } from '../src/worker'
import { createMokupWorker as createNodeWorker } from '../src/worker-node'

const manifest = {
  version: 1,
  routes: [
    {
      method: 'GET',
      url: '/ping',
      response: {
        type: 'text',
        body: 'pong',
      },
    },
  ],
} as const

describe('worker adapters', () => {
  it('creates a node worker for manifests', async () => {
    const worker = createNodeWorker(manifest)
    const response = await worker.fetch(new Request('http://localhost/ping'))
    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe('pong')
  })

  it('returns 404 from node workers on missing routes', async () => {
    const worker = createNodeWorker(manifest)
    const response = await worker.fetch(new Request('http://localhost/missing'))
    expect(response.status).toBe(404)
  })

  it('rejects dir input in web worker helper', () => {
    expect(() => createWebWorker('mock' as never)).toThrow(TypeError)
  })
})
