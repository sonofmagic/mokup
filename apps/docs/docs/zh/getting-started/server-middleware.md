# 服务端中间件

如果你已有服务端应用，可以直接注入 mokup 中间件。
如果只是需要一个带热更新的开发服务器，直接用 `createFetchServer`。

## 开发服务器（推荐）

```ts
import { createFetchServer } from 'mokup/server'
import { serve } from 'mokup/server/node'

const app = await createFetchServer({ entries: { dir: 'mock' } })
serve({ fetch: app.fetch, port: 3000 })
```

## 中间件集成（Build 模式）

如果你需要稳定的生产构建，请使用 build 模式。

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

## 注册中间件

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

更多适配与参数见 [Server 适配器](/zh/reference/server)。
