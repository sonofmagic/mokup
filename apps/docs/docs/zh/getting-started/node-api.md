# Node.js API

开发阶段优先使用 Node dev server，生产构建再使用 runtime API。

## Dev 模式（推荐）

```ts
import { serve } from '@hono/node-server'
import { createFetchServer } from 'mokup/server/node'

const app = await createFetchServer({ entries: { dir: 'mock' } })
serve({ fetch: app.fetch, port: 3000 })
```

也可以传入多个目录：

```ts
const app = await createFetchServer({ entries: [{ dir: 'mock' }, { dir: 'fixtures' }] })
serve({ fetch: app.fetch, port: 3000 })
```

## Deno / Bun（fetch 入口）

```ts
import { createFetchServer } from 'mokup/server/node'

const app = await createFetchServer({
  entries: { dir: 'mock' },
  playground: false,
})
const response = await app.fetch(new Request('http://localhost/api/users'))
```

## Build 模式

如果你需要稳定的生产构建，请使用 build 模式。

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

## 处理请求

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

## (可选) 接入 Node HTTP

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

如果你更偏好框架中间件，请查看 [服务端中间件](./server-middleware) 或 [Server 适配器](/zh/reference/server)。
