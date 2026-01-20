import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createMokupServer } from '../src/node'

describe('node server', () => {
  it('serves mock routes and playground routes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-node-'))
    const mockDir = join(root, 'mock')
    await mkdir(mockDir, { recursive: true })
    await writeFile(
      join(mockDir, 'users.get.json'),
      JSON.stringify({ id: 1 }, null, 2),
      'utf8',
    )

    const server = await createMokupServer({
      dir: mockDir,
      host: '127.0.0.1',
      port: 0,
      log: false,
    })

    try {
      const { host, port } = await server.listen()
      const base = `http://${host}:${port}`

      const response = await fetch(`${base}/users`)
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ id: 1 })

      const routesResponse = await fetch(`${base}/_mokup/routes`)
      expect(routesResponse.status).toBe(200)
      const payload = await routesResponse.json()
      expect(payload.count).toBe(1)
      expect(payload.routes[0]?.url).toBe('/users')
    }
    finally {
      await server.close()
    }
  })
})
