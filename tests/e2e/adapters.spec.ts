import type { MokupServerOptions } from 'mokup/server'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Buffer } from 'node:buffer'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { Hono } from '@mokup/shared/hono'
import { expect, test } from '@playwright/test'
import {
  createConnectMiddleware,
  createExpressMiddleware,
  createFastifyPlugin,
  createFetchServer,
  createHonoMiddleware,
  createKoaMiddleware,

} from 'mokup/server'
import { runCommand } from './utils/command'
import { ensureEmptyDir, readJson } from './utils/fs'
import { fetchJson, listen } from './utils/http'
import { repoRoot } from './utils/paths'

const mockDir = 'apps/web/mock'

let outDir = ''
let options: MokupServerOptions

test.beforeAll(async (_context, testInfo) => {
  outDir = testInfo.outputPath('adapter-build')
  await ensureEmptyDir(outDir)
  await runCommand(
    'pnpm',
    ['exec', 'mokup', 'build', '--dir', mockDir, '--out', outDir],
    { cwd: repoRoot },
  )
  const manifest = await readJson<MokupServerOptions['manifest']>(
    join(outDir, 'mokup.manifest.json'),
  )
  options = {
    manifest,
    moduleBase: outDir,
    onNotFound: 'response',
  }
})

type ConnectMiddleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void

async function runConnectStyleRequest(middleware: ConnectMiddleware) {
  const server = createServer(async (req, res) => {
    await middleware(req, res, () => {
      res.statusCode = 404
      res.end()
    })
  })

  const { url, close } = await listen(server)
  const { json } = await fetchJson(`${url}/profile`)
  await close()

  return json
}

async function runPostWithBody(middleware: ConnectMiddleware) {
  const server = createServer(async (req, res) => {
    await middleware(req, res, () => {
      res.statusCode = 404
      res.end()
    })
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

    await middleware(ctx, async () => {
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
  let onRequest: ((request: { raw?: IncomingMessage }, reply: {
    status: (code: number) => unknown
    header: (name: string, value: string) => unknown
    send: (payload?: unknown) => void
  }) => Promise<void> | void) | undefined
  const instance = {
    addHook: (name: 'onRequest' | 'preHandler', handler: typeof onRequest) => {
      if (name === 'onRequest') {
        onRequest = handler
      }
    },
  }
  const init = plugin(instance)

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
      await onRequest({ raw: req }, reply)
    }

    if (!res.writableEnded) {
      res.end()
    }
  })
}

test('connect and express middleware serve JSON', async () => {
  const connectJson = await runConnectStyleRequest(createConnectMiddleware(options))
  expect(connectJson.name).toBe('Orion Vale')

  const expressJson = await runConnectStyleRequest(createExpressMiddleware(options))
  expect(expressJson.name).toBe('Orion Vale')
})

test('connect middleware handles POST bodies', async () => {
  const json = await runPostWithBody(createConnectMiddleware(options))
  expect(json.token).toBe('mock-token-7d91')
})

test('koa middleware serves JSON', async () => {
  const server = createKoaServer(createKoaMiddleware(options))
  const { url, close } = await listen(server)
  const { json } = await fetchJson(`${url}/profile`)
  await close()

  expect(json.name).toBe('Orion Vale')
})

test('fastify plugin serves JSON', async () => {
  const server = createFastifyServer(createFastifyPlugin(options))
  const { url, close } = await listen(server)
  const { json } = await fetchJson(`${url}/profile`)
  await close()

  expect(json.name).toBe('Orion Vale')
})

test('hono middleware serves JSON', async () => {
  const app = new Hono()
  app.use(createHonoMiddleware(options))

  const response = await app.fetch(new Request('http://localhost/profile'))
  const json = await response.json() as Record<string, unknown>

  expect(json.name).toBe('Orion Vale')
})

test('fetch server serves JSON', async () => {
  const server = await createFetchServer({
    dir: mockDir,
    root: repoRoot,
    log: false,
    watch: false,
  })

  const response = await server.fetch(new Request('http://localhost/profile'))
  const json = await response.json() as Record<string, unknown>

  expect(json.name).toBe('Orion Vale')

  await server.close?.()
})
