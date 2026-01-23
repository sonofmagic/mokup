# Node.js API

Use the Node dev server during development, and fall back to the runtime API for production builds.

## Dev mode (recommended)

```ts
import { serve } from '@hono/node-server'
import { createFetchServer } from 'mokup/server/node'

const app = await createFetchServer({ entries: { dir: 'mock' } })
serve({ fetch: app.fetch, port: 3000 })
```

You can also pass multiple directories:

```ts
const app = await createFetchServer({ entries: [{ dir: 'mock' }, { dir: 'fixtures' }] })
serve({ fetch: app.fetch, port: 3000 })
```

## Deno / Bun (fetch server)

```ts
import { createFetchServer } from 'mokup/server/node'

const app = await createFetchServer({
  entries: { dir: 'mock' },
  playground: false,
})
const response = await app.fetch(new Request('http://localhost/api/users'))
```

## Build mode

Use build mode when you want a stable bundle for production.

```bash
pnpm exec mokup build --dir mock --out .mokup
```

```ts
import { createRuntime } from 'mokup/runtime'
import mokupBundle from './.mokup/mokup.bundle.mjs'

const runtime = createRuntime({
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: mokupBundle.moduleBase,
})
```

## Handle a request

```ts
const result = await runtime.handle({
  method: 'GET',
  path: '/api/users',
  query: {},
  headers: {},
  body: undefined,
})

if (result) {
  console.log(result.status, result.headers, result.body)
}
```

## (Optional) Bridge to Node HTTP

```ts
import http from 'node:http'

http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const result = await runtime.handle({
    method: req.method ?? 'GET',
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    headers: req.headers,
    body: undefined,
  })

  if (!result) {
    res.statusCode = 404
    res.end('Not Found')
    return
  }

  res.statusCode = result.status
  for (const [key, value] of Object.entries(result.headers ?? {})) {
    res.setHeader(key, value)
  }
  res.end(result.body ?? '')
}).listen(3000)
```

If you prefer framework middleware, see [Server Middleware](./server-middleware) or the [Server Adapters](/reference/server).
