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

Hono 适配器可在 Hono 支持的运行时中使用，Cloudflare Worker 请使用专用入口。

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

## Worker 入口

Worker 环境（含 Cloudflare Workers）请使用：

```ts
import { createMokupWorker } from 'mokup/server/worker'
```
