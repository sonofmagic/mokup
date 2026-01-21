import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
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

  it('creates workers from bundle inputs', async () => {
    const worker = createWebWorker({
      manifest,
      onNotFound: 'next',
      moduleBase: 'file:///tmp/',
      moduleMap: { mock: {} },
    })
    const response = await worker.fetch(new Request('http://localhost/missing'))
    expect(response.status).toBe(404)

    const nodeWorker = createNodeWorker({
      manifest,
      onNotFound: 'response',
      moduleBase: 'file:///tmp/',
    })
    const nodeResponse = await nodeWorker.fetch(new Request('http://localhost/ping'))
    expect(nodeResponse.status).toBe(200)
  })

  it('loads node worker bundles from directories', async () => {
    const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-worker-'))
    try {
      await fs.writeFile(
        path.join(root, 'mokup.manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf8',
      )
      await fs.mkdir(path.join(root, 'mokup-handlers'), { recursive: true })
      await fs.writeFile(
        path.join(root, 'mokup-handlers', 'index.mjs'),
        'export const mokupModuleMap = {}',
        'utf8',
      )

      const worker = await createNodeWorker(root)
      const response = await worker.fetch(new Request('http://localhost/ping'))
      expect(response.status).toBe(200)
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
