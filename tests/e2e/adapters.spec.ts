import type { ServerOptions } from '../../packages/server/src/index'
import { Buffer } from 'node:buffer'
import { mkdtemp } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import {
  createConnectMiddleware,
  createExpressMiddleware,
  createFastifyPlugin,
  createFetchServer,
  createHonoMiddleware,
  createKoaMiddleware,
} from '../../packages/server/src/node'
import { Hono } from '../../packages/shared/src/hono'
import { runMokup } from './utils/command'
import { readJson } from './utils/fs'
import { fetchJson, listen } from './utils/http'
import { repoRoot } from './utils/paths'

const mockDir = 'apps/mokup-web-demo/mock'

let outDir = ''
let options: ServerOptions

test.beforeAll(async ({ request: _request }) => {
  outDir = await mkdtemp(join(tmpdir(), 'mokup-adapters-'))
  await runMokup(
    ['build', '--dir', mockDir, '--out', outDir],
    { cwd: repoRoot },
  )
  const manifest = await readJson<ServerOptions['manifest']>(
    join(outDir, 'mokup.manifest.json'),
  )
  options = {
    manifest,
    moduleBase: outDir,
    onNotFound: 'response',
  }
})

type ConnectHandler = ReturnType<typeof createConnectMiddleware>
type KoaHandler = ReturnType<typeof createKoaMiddleware>
type FastifyPlugin = ReturnType<typeof createFastifyPlugin>
type ConnectMiddleware = ConnectHandler
type FastifyInstance = Parameters<FastifyPlugin>[0]
type FastifyHook = Parameters<FastifyInstance['addHook']>[1]

async function runConnectStyleRequest(middleware: ConnectMiddleware) {
  const server = createServer(async (req, res) => {
    await middleware(
      req as Parameters<ConnectHandler>[0],
      res as Parameters<ConnectHandler>[1],
      () => {
        res.statusCode = 404
        res.end()
      },
    )
  })

  const { url, close } = await listen(server)
  const { json } = await fetchJson(`${url}/profile`)
  await close()

  return json
}

async function runPostWithBody(middleware: ConnectMiddleware) {
  const server = createServer(async (req, res) => {
    await middleware(
      req as Parameters<ConnectHandler>[0],
      res as Parameters<ConnectHandler>[1],
      () => {
        res.statusCode = 404
        res.end()
      },
    )
  })

  const { url, close } = await listen(server)
  const { json } = await fetchJson(`${url}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'mokup',
      password: '123456',
    }),
  })
  await close()

  return json
}

function createKoaServer(middleware: ReturnType<typeof createKoaMiddleware>) {
  return createServer(async (req, res) => {
    const headers: Record<string, string> = {}
    const ctx = {
      req,
      request: {
        headers: req.headers as Record<string, string | string[] | undefined>,
      },
      status: 404,
      body: null as unknown,
      set: (header: Record<string, string>) => {
        for (const [key, value] of Object.entries(header)) {
          headers[key] = value
        }
      },
    }

    await middleware(ctx as Parameters<KoaHandler>[0], async () => {
      ctx.status = 404
    })

    res.statusCode = ctx.status ?? 404
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value)
    }

    if (ctx.body === null || typeof ctx.body === 'undefined') {
      res.end()
      return
    }
    if (ctx.body instanceof Uint8Array) {
      res.end(Buffer.from(ctx.body))
      return
    }
    if (typeof ctx.body === 'string' || Buffer.isBuffer(ctx.body)) {
      res.end(ctx.body)
      return
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(ctx.body))
  })
}

function createFastifyServer(plugin: ReturnType<typeof createFastifyPlugin>) {
  let onRequest: FastifyHook | undefined
  const instance = {
    addHook: (name: 'onRequest' | 'preHandler', handler: FastifyHook) => {
      if (name === 'onRequest') {
        onRequest = handler
      }
    },
  }
  const init = plugin(instance as unknown as FastifyInstance)

  return createServer(async (req, res) => {
    await init

    const reply = {
      status: (code: number) => {
        res.statusCode = code
        return reply
      },
      header: (name: string, value: string) => {
        res.setHeader(name, value)
        return reply
      },
      send: (payload?: unknown) => {
        if (res.writableEnded) {
          return
        }
        if (payload === null || typeof payload === 'undefined') {
          res.end()
          return
        }
        if (payload instanceof Uint8Array) {
          res.end(Buffer.from(payload))
          return
        }
        if (typeof payload === 'string' || Buffer.isBuffer(payload)) {
          res.end(payload)
          return
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(payload))
      },
    }

    if (onRequest) {
      await onRequest(
        { raw: req } as unknown as Parameters<FastifyHook>[0],
        reply as Parameters<FastifyHook>[1],
      )
    }

    if (!res.writableEnded) {
      res.end()
    }
  })
}

test('connect and express middleware serve JSON', async () => {
  const connectJson = await runConnectStyleRequest(createConnectMiddleware(options))
  expect(connectJson['name']).toBe('Orion Vale')

  const expressJson = await runConnectStyleRequest(createExpressMiddleware(options))
  expect(expressJson['name']).toBe('Orion Vale')
})

test('connect middleware handles POST bodies', async () => {
  const json = await runPostWithBody(createConnectMiddleware(options))
  expect(json['token']).toMatch(/^[a-z0-9]{18}$/)
})

test('koa middleware serves JSON', async () => {
  const server = createKoaServer(createKoaMiddleware(options))
  const { url, close } = await listen(server)
  const { json } = await fetchJson(`${url}/profile`)
  await close()

  expect(json['name']).toBe('Orion Vale')
})

test('fastify plugin serves JSON', async () => {
  const server = createFastifyServer(createFastifyPlugin(options))
  const { url, close } = await listen(server)
  const { json } = await fetchJson(`${url}/profile`)
  await close()

  expect(json['name']).toBe('Orion Vale')
})

test('hono middleware serves JSON', async () => {
  const app = new Hono()
  app.use(createHonoMiddleware(options))

  const response = await app.fetch(new Request('http://localhost/profile'))
  const json = await response.json() as Record<string, unknown>

  expect(json['name']).toBe('Orion Vale')
})

test('fetch server serves JSON', async () => {
  const server = await createFetchServer({
    entries: {
      dir: mockDir,
      root: repoRoot,
      log: false,
      watch: false,
    },
  })

  const response = await server.fetch(new Request('http://localhost/profile'))
  const json = await response.json() as Record<string, unknown>

  expect(json['name']).toBe('Orion Vale')

  await server.close?.()
})
