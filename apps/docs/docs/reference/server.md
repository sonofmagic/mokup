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

The Hono adapter runs anywhere Hono can run. Use the Worker entry for Cloudflare Workers.

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

## Worker entry

For Workers (including Cloudflare Workers), use:

```ts
import { createMokupWorker } from 'mokup/server/worker'
```
