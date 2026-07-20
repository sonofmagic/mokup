import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createAdaptorServer } from '@hono/node-server'
import { describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
import { createFetchServer } from '../src/fetch-server'

function listenServer(server: ReturnType<typeof createAdaptorServer>) {
  return new Promise<{ host: string, port: number } | null>((resolve, reject) => {
    let onError: (error: Error) => void
    const onListening = () => {
      server.off('error', onError)
      const address = server.address()
      const host = typeof address === 'string' ? '127.0.0.1' : address?.address ?? '127.0.0.1'
      const port = typeof address === 'string' ? 0 : address?.port ?? 0
      resolve({ host, port })
    }
    onError = (error: Error) => {
      server.off('listening', onListening)
      if ('code' in error && error.code === 'EPERM') {
        resolve(null)
        return
      }
      reject(error)
    }
    server.once('error', onError)
    server.once('listening', onListening)
    server.listen(0, '127.0.0.1')
  })
}

function closeServer(server: ReturnType<typeof createAdaptorServer>) {
  return new Promise<void>((resolve, reject) => {
    try {
      server.close((error?: Error) => {
        if (error) {
          if (error.message === 'Server is not running.') {
            resolve()
            return
          }
          reject(error)
          return
        }
        resolve()
      })
    }
    catch (error) {
      if (error instanceof Error && error.message === 'Server is not running.') {
        resolve()
        return
      }
      reject(error)
    }
  })
}

function readWebSocketMessage(socket: WebSocket) {
  return new Promise<unknown>((resolve, reject) => {
    socket.once('message', (data) => {
      resolve(JSON.parse(data.toString()))
    })
    socket.once('error', reject)
  })
}

describe('node server', () => {
  it('serves playground metrics over websocket', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-node-ws-'))
    const mockDir = join(root, 'mock')
    await mkdir(mockDir, { recursive: true })
    await writeFile(join(mockDir, 'ping.get.json'), '{"ok":true}', 'utf8')

    const fetchServer = await createFetchServer({
      entries: { dir: mockDir, log: false, watch: false },
      playground: { enabled: true },
    })
    expect(fetchServer.websocket).toBeDefined()
    const nodeServer = createAdaptorServer({
      fetch: fetchServer.fetch,
      ...(fetchServer.websocket ? { websocket: fetchServer.websocket } : {}),
    })
    let socket: WebSocket | undefined

    try {
      const listening = await listenServer(nodeServer)
      if (!listening) {
        return
      }
      const { host, port } = listening
      socket = new WebSocket(`ws://${host}:${port}/__mokup/ws`)

      await expect(readWebSocketMessage(socket)).resolves.toEqual({
        type: 'snapshot',
        total: 0,
        perRoute: {},
      })

      const increment = readWebSocketMessage(socket)
      await fetch(`http://${host}:${port}/ping`)
      await expect(increment).resolves.toEqual({
        type: 'increment',
        routeKey: 'GET /ping',
        total: 1,
      })
    }
    finally {
      socket?.terminate()
      await closeServer(nodeServer)
      await fetchServer.close?.()
    }
  })

  it('serves mock routes and playground routes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-node-'))
    const mockDir = join(root, 'mock')
    await mkdir(mockDir, { recursive: true })
    await writeFile(
      join(mockDir, 'users.get.json'),
      JSON.stringify({ id: 1 }, null, 2),
      'utf8',
    )

    const fetchServer = await createFetchServer({
      entries: {
        dir: mockDir,
        log: false,
        watch: false,
      },
    })
    const nodeServer = createAdaptorServer({ fetch: fetchServer.fetch })

    try {
      const listening = await listenServer(nodeServer)
      if (!listening) {
        return
      }
      const { host, port } = listening
      const base = `http://${host}:${port}`

      const response = await fetch(`${base}/users`)
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ id: 1 })

      const routesResponse = await fetch(`${base}/__mokup/routes`)
      expect(routesResponse.status).toBe(200)
      const payload = await routesResponse.json()
      expect(payload.count).toBe(1)
      expect(payload.routes[0]?.url).toBe('/users')
    }
    finally {
      await closeServer(nodeServer)
      if (fetchServer.close) {
        await fetchServer.close()
      }
    }
  })

  it('supports multiple dir entries with prefix', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-node-'))
    const mockDir = join(root, 'mock')
    const extraDir = join(root, 'fixtures')
    await mkdir(mockDir, { recursive: true })
    await mkdir(extraDir, { recursive: true })
    await writeFile(
      join(mockDir, 'users.get.json'),
      JSON.stringify({ id: 2 }, null, 2),
      'utf8',
    )
    await writeFile(
      join(extraDir, 'teams.get.json'),
      JSON.stringify({ id: 3 }, null, 2),
      'utf8',
    )

    const fetchServer = await createFetchServer({
      entries: [
        { dir: mockDir, watch: false, log: false },
        { dir: extraDir, prefix: '/api', watch: false, log: false },
      ],
    })
    const nodeServer = createAdaptorServer({ fetch: fetchServer.fetch })

    try {
      const listening = await listenServer(nodeServer)
      if (!listening) {
        return
      }
      const { host, port } = listening
      const response = await fetch(`http://${host}:${port}/users`)
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ id: 2 })

      const prefixed = await fetch(`http://${host}:${port}/api/teams`)
      expect(prefixed.status).toBe(200)
      await expect(prefixed.json()).resolves.toEqual({ id: 3 })
    }
    finally {
      await closeServer(nodeServer)
      if (fetchServer.close) {
        await fetchServer.close()
      }
    }
  })
})
