# Server Adapters

`mokup/server/node` bundles the Node adapters and dev server helpers. Use
`mokup/server/worker` for Workers or `mokup/server/fetch` for runtime-agnostic fetch handlers.

## Fetch server (Node)

Use cases:

- Start a standalone mock server from local mock files.
- Embed a fetch-capable mock server inside another Node process.

Demo:

```ts
import { createFetchServer, serve } from 'mokup/server/node'

const app = await createFetchServer({
  entries: { dir: 'mock' },
  playground: false,
})
serve({ fetch: app.fetch, port: 3000 })
```

You can call `app.fetch` directly:

Use cases:

- Call the mock server from tests or other server logic without binding a port.

Demo:

```ts
const response = await app.fetch(new Request('http://localhost/api/users'))
```

## Options

Use cases:

- Provide `moduleMap`/`moduleBase` when running in a sandboxed runtime.
- Choose `onNotFound: 'response'` for a standalone fetch handler that should return 404.

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

Demo:

```ts
import type { ServerOptions } from 'mokup/server'
import mokupBundle from './.mokup/mokup.bundle.mjs'

const options: ServerOptions = {
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: mokupBundle.moduleBase,
  onNotFound: 'response',
}
```

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

Use cases:

- Add mock routes into an existing Express app.
- Reuse the same manifest across multiple Express instances.

Demo:

```ts
import { createExpressMiddleware } from 'mokup/server/node'

app.use(createExpressMiddleware({ manifest }))
```

## Connect

Use cases:

- Add mocks to a Connect-based stack or legacy middleware chain.

Demo:

```ts
import { createConnectMiddleware } from 'mokup/server/node'

app.use(createConnectMiddleware({ manifest }))
```

## Koa

Use cases:

- Inject mock routes into a Koa server without rewriting handlers.

Demo:

```ts
import { createKoaMiddleware } from 'mokup/server/node'

app.use(createKoaMiddleware({ manifest }))
```

## Hono

Use cases:

- Mount Mokup inside a Hono app running on Node or edge runtimes.

Demo:

```ts
import { createHonoMiddleware } from 'mokup/server/node'

app.use(createHonoMiddleware({ manifest }))
```

## Fastify

Use cases:

- Plug Mokup into a Fastify server with the standard plugin API.

Demo:

```ts
import { createFastifyPlugin } from 'mokup/server/node'

await app.register(createFastifyPlugin({ manifest }))
```

## Fetch / Worker

Use cases:

- Build a runtime-agnostic fetch handler (Workers, edge, custom servers).
- Combine Mokup routes with your own routing logic.

Demo:

```ts
import { createFetchHandler } from 'mokup/server/fetch'

const handler = createFetchHandler({ manifest })
const response = await handler(new Request('https://example.com/api'))
```

## Worker entry

For Workers (including Cloudflare Workers), use the helper entry. It wraps
`createFetchHandler` from `mokup/server/fetch` and returns a 404 response when
the handler yields `null`:

Use cases:

- Deploy Mokup to Cloudflare Workers with the smallest entry file.
- Avoid manual 404 handling when the mock handler returns `null`.

Demo:

```ts
import { createMokupWorker } from 'mokup/server/worker'
import mokupBundle from 'virtual:mokup-bundle'

export default createMokupWorker(mokupBundle)
```
