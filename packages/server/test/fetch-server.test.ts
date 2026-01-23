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
      entries: {
        dir: mockDir,
        log: false,
        watch: false,
      },
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
      entries: {
        dir: mockDir,
        log: false,
        watch: false,
      },
      playground: false,
    })

    const response = await server.fetch(new Request('http://localhost/__mokup'))
    expect(response.status).toBe(404)
  })

  it('supports multiple option entries with prefixes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-fetch-'))
    const dirA = join(root, 'mock-a')
    const dirB = join(root, 'mock-b')
    await mkdir(dirA, { recursive: true })
    await mkdir(dirB, { recursive: true })
    await writeFile(join(dirA, 'users.get.json'), '{"id":1}', 'utf8')
    await writeFile(join(dirB, 'teams.get.json'), '{"id":2}', 'utf8')

    const server = await createFetchServer({
      entries: [
        {
          dir: dirA,
          prefix: '/api',
          log: false,
          watch: false,
        },
        {
          dir: dirB,
          prefix: '/v2',
          log: false,
          watch: false,
        },
      ],
      playground: false,
    })

    const users = await server.fetch(new Request('http://localhost/api/users'))
    expect(users.status).toBe(200)
    await expect(users.json()).resolves.toEqual({ id: 1 })

    const teams = await server.fetch(new Request('http://localhost/v2/teams'))
    expect(teams.status).toBe(200)
    await expect(teams.json()).resolves.toEqual({ id: 2 })
  })
})
