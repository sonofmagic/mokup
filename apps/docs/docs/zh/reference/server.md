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

## Express / Connect

```ts
import { createExpressMiddleware } from 'mokup/server'

app.use(createExpressMiddleware({ manifest }))
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

Worker 环境请使用专用入口：

```ts
import { createMokupWorker } from 'mokup/server/worker'
```
