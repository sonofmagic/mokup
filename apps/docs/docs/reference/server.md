# Server Adapters

`mokup/server` ships adapters for multiple frameworks, all sharing `MokupServerOptions`.

## Options

```ts
export interface MokupServerOptions {
  manifest: Manifest | (() => Promise<Manifest>)
  moduleBase?: string | URL
  moduleMap?: Record<string, Record<string, unknown>>
  onNotFound?: 'next' | 'response'
}
```

`onNotFound` defaults to `'next'`. Use `'response'` to return 404 instead of falling through.

## Node.js dev server (no build)

Use the built-in Node.js server when you want an instant mock server from a directory.

```ts
import { startMokupServer } from 'mokup/server'

await startMokupServer({
  dir: 'mock',
  prefix: '/api',
  port: 3000,
})
```

Or use the CLI:

```bash
pnpm exec mokup serve --dir mock --prefix /api --port 3000
```

## Prepare manifest

You can load the CLI build output directly:

```bash
pnpm exec mokup build --dir mock --out .mokup
```

```ts
import mokupBundle from './.mokup/mokup.bundle.mjs'

const options = {
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: new URL('./.mokup/', import.meta.url),
}
```

Pass `options` to any adapter below. For brevity, the examples use `manifest` directly.

## Express

```ts
import { createExpressMiddleware } from 'mokup/server'

app.use(createExpressMiddleware({ manifest }))
```

## Connect

```ts
import { createConnectMiddleware } from 'mokup/server'

app.use(createConnectMiddleware({ manifest }))
```

## Koa

```ts
import { createKoaMiddleware } from 'mokup/server'

app.use(createKoaMiddleware({ manifest }))
```

## Hono

```ts
import { createHonoMiddleware } from 'mokup/server'

app.use(createHonoMiddleware({ manifest }))
```

## Fastify

```ts
import { createFastifyPlugin } from 'mokup/server'

await app.register(createFastifyPlugin({ manifest }))
```

## Fetch / Worker

```ts
import { createFetchHandler } from 'mokup/server'

const handler = createFetchHandler({ manifest })
const response = await handler(new Request('https://example.com/api'))
```

## Node.js HTTP server

```ts
import { Buffer } from 'node:buffer'
import { createServer } from 'node:http'
import { createFetchHandler } from 'mokup/server'

const handler = createFetchHandler({ manifest })

createServer(async (req, res) => {
  const host = req.headers.host ?? 'localhost'
  const url = new URL(req.url ?? '/', `http://${host}`)
  const request = new Request(url, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req,
  })
  const response = await handler(request)
  if (!response) {
    res.statusCode = 404
    res.end()
    return
  }
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(Buffer.from(await response.arrayBuffer()))
}).listen(3000)
```

Workers should use:

```ts
import { createMokupWorker } from 'mokup/server/worker'
```
