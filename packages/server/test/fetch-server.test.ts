import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createFetchServer } from '../src/fetch-server'

describe('fetch server', () => {
  it('serves mock routes and refreshes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-fetch-'))
    const mockDir = join(root, 'mock')
    await mkdir(mockDir, { recursive: true })
    await writeFile(
      join(mockDir, 'users.get.json'),
      JSON.stringify({ id: 1 }, null, 2),
      'utf8',
    )

    const server = await createFetchServer({
      dir: mockDir,
      log: false,
      watch: false,
      playground: false,
    })

    const response = await server.fetch(new Request('http://localhost/users'))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ id: 1 })

    await writeFile(
      join(mockDir, 'teams.get.json'),
      JSON.stringify({ id: 2 }, null, 2),
      'utf8',
    )

    await server.refresh()

    const refreshed = await server.fetch(new Request('http://localhost/teams'))
    expect(refreshed.status).toBe(200)
    await expect(refreshed.json()).resolves.toEqual({ id: 2 })
  })

  it('disables playground when configured', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-fetch-'))
    const mockDir = join(root, 'mock')
    await mkdir(mockDir, { recursive: true })

    const server = await createFetchServer({
      dir: mockDir,
      log: false,
      watch: false,
      playground: false,
    })

    const response = await server.fetch(new Request('http://localhost/_mokup'))
    expect(response.status).toBe(404)
  })
})
