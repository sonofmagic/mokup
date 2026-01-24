# Server Adapters

`mokup/server` bundles the Node adapters and dev server helpers. Use
`mokup/server/worker` for Workers or `mokup/server/fetch` for runtime-agnostic fetch handlers.

## Fetch server (Node)

```ts
import { createFetchServer } from 'mokup/server'
import { serve } from 'mokup/server/node'

const app = await createFetchServer({
  entries: { dir: 'mock' },
  playground: false,
})
serve({ fetch: app.fetch, port: 3000 })
```

You can call `app.fetch` directly:

```ts
const response = await app.fetch(new Request('http://localhost/api/users'))
```

## Options

```ts
export interface ServerOptions {
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

::: code-group

```bash [pnpm]
pnpm exec mokup build --dir mock --out .mokup
```

```bash [npm]
npm exec mokup build --dir mock --out .mokup
```

```bash [yarn]
yarn mokup build --dir mock --out .mokup
```

```bash [bun]
bunx mokup build --dir mock --out .mokup
```

:::

```ts
import mokupBundle from './.mokup/mokup.bundle.mjs'

const options = {
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: mokupBundle.moduleBase,
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
import { createFetchHandler } from 'mokup/server/fetch'

const handler = createFetchHandler({ manifest })
const response = await handler(new Request('https://example.com/api'))
```

## Worker entry

For Workers (including Cloudflare Workers), use the helper entry. It wraps
`createFetchHandler` from `mokup/server/fetch` and returns a 404 response when
the handler yields `null`:

```ts
import { createMokupWorker } from 'mokup/server/worker'
```
