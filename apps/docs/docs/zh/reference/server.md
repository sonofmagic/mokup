# Server 适配器

`mokup/server` 提供多种框架的适配器，统一使用 `MokupServerOptions`。

## 选项

```ts
export interface MokupServerOptions {
  manifest: Manifest | (() => Promise<Manifest>)
  moduleBase?: string | URL
  moduleMap?: Record<string, Record<string, unknown>>
  onNotFound?: 'next' | 'response'
}
```

`onNotFound` 默认是 `'next'`，设为 `'response'` 会直接返回 404。

## Node.js 服务直启（无需构建）

当你只需要从目录快速启动一个独立服务时，可以直接使用内置的 Node.js 服务。

```ts
import { startMokupServer } from 'mokup/server'

await startMokupServer({
  dir: 'mock',
  prefix: '/api',
  port: 3000,
})
```

或使用 CLI：

```bash
pnpm exec mokup serve --dir mock --prefix /api --port 3000
```

## 准备 manifest

可直接加载 CLI 生成的 bundle：

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

上面的 `options` 可直接传给任意适配器，下方示例为简洁起见直接传 `manifest`。

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

## Node.js HTTP Server

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

Worker 环境请使用专用入口：

```ts
import { createMokupWorker } from 'mokup/server/worker'
```
