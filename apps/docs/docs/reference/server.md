# Server Adapters

`@mokup/server` ships adapters for multiple frameworks, all sharing `MokupServerOptions`.

## Options

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
import { createExpressMiddleware } from '@mokup/server'

app.use(createExpressMiddleware({ manifest }))
```

## Koa

```ts
import { createKoaMiddleware } from '@mokup/server'

app.use(createKoaMiddleware({ manifest }))
```

## Hono

```ts
import { createHonoMiddleware } from '@mokup/server'

app.use(createHonoMiddleware({ manifest }))
```

## Fastify

```ts
import { createFastifyPlugin } from '@mokup/server'

await app.register(createFastifyPlugin({ manifest }))
```

## Fetch / Worker

```ts
import { createFetchHandler } from '@mokup/server'

const handler = createFetchHandler({ manifest })
const response = await handler(new Request('https://example.com/api'))
```

Workers should use:

```ts
import { createMokupWorker } from '@mokup/server/worker'
```
