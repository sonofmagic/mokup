# Server Middleware

Use middleware when you already have a server app and want to inject mokup routes.
If you just need a dev server with hot reload, use `createFetchServer`.

## Dev server (recommended)

```ts
import { serve } from '@hono/node-server'
import { createFetchServer } from 'mokup/server'

const app = await createFetchServer({ dir: 'mock' })
serve({ fetch: app.fetch, port: 3000 })
```

## Middleware integration (build mode)

Use build mode when you want a stable bundle for production.

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

## Register the middleware

### Express

```ts
import express from 'express'
import { createExpressMiddleware } from 'mokup/server'

const app = express()
app.use(createExpressMiddleware(options))
```

### Koa

```ts
import Koa from 'koa'
import { createKoaMiddleware } from 'mokup/server'

const app = new Koa()
app.use(createKoaMiddleware(options))
```

### Fastify

```ts
import Fastify from 'fastify'
import { createFastifyPlugin } from 'mokup/server'

const app = Fastify()
await app.register(createFastifyPlugin(options))
```

### Hono

```ts
import { Hono } from 'hono'
import { createHonoMiddleware } from 'mokup/server'

const app = new Hono()
app.use(createHonoMiddleware(options))
```

See the [Server Adapters](/reference/server) for more frameworks and options.
