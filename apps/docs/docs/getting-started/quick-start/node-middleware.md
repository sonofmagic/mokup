# Node.js Middleware Quick Start

Use this flow when you want to attach Mokup to an existing Node.js server.

## 1. Build the manifest

```bash
pnpm exec mokup build --dir mock --out .mokup
```

## 2. Load the bundle

```ts
import mokupBundle from './.mokup/mokup.bundle.mjs'

export const mokupOptions = {
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: new URL('./.mokup/', import.meta.url),
}
```

## 3. Attach middleware

### Express

```ts
import { createExpressMiddleware } from 'mokup/server'
import { mokupOptions } from './mokup-options'

app.use(createExpressMiddleware(mokupOptions))
```

### Koa

```ts
import { createKoaMiddleware } from 'mokup/server'
import { mokupOptions } from './mokup-options'

app.use(createKoaMiddleware(mokupOptions))
```

### Hono

```ts
import { createHonoMiddleware } from 'mokup/server'
import { mokupOptions } from './mokup-options'

app.use(createHonoMiddleware(mokupOptions))
```

### Fastify

```ts
import { createFastifyPlugin } from 'mokup/server'
import { mokupOptions } from './mokup-options'

await app.register(createFastifyPlugin(mokupOptions))
```

## Notes

- Re-run `mokup build` when mock files change, or switch to the [Node.js dev server](./node-server) for live watching.
- Set `onNotFound: 'response'` to return 404 instead of falling through.
