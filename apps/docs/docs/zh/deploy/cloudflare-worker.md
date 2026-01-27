# Cloudflare Worker

> 快速上手请参考 [入门指南 - Cloudflare](../getting-started/cloudflare)。

Mokup 可以直接运行在 Worker 中，推荐使用 `mokup/server/fetch`。如需更简洁的
Worker 封装，也可使用 `mokup/server/worker`。

## 1. Worker 入口（虚拟 bundle）

使用 `mokup/vite` 时，可以直接导入 Vite 生成的虚拟模块：

```ts
import { createMokupWorker } from 'mokup/server/worker'
import mokupBundle from 'virtual:mokup-bundle'

export default createMokupWorker(mokupBundle)
```

## 2. Wrangler 配置

`wrangler.jsonc` 示例：

```jsonc
{
  "name": "web-mokup-worker",
  "main": "worker/src/index.ts",
  "compatibility_date": "2025-01-15"
}
```

## 3. 构建与部署

```bash
vite dev
vite build
wrangler deploy
```

使用虚拟 bundle 时无需手动传入 `moduleBase` 或 `moduleMap`。

下面是一个不使用任何框架的 fetch 示例：

```ts
import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from 'virtual:mokup-bundle'

const handler = createFetchHandler(mokupBundle)

export default {
  fetch: async (request: Request) => {
    const url = new URL(request.url)
    if (url.pathname === '/health') {
      return new Response('ok')
    }
    return (await handler(request)) ?? new Response('Not Found', { status: 404 })
  },
}
```

也可以显式传入字段：

```ts
import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from 'virtual:mokup-bundle'

const handler = createFetchHandler({
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: mokupBundle.moduleBase,
})
```

也可以与 Hono 路由结合（未安装请先添加 `hono`）：

```ts
import { Hono } from 'hono'
import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from 'virtual:mokup-bundle'

const handler = createFetchHandler(mokupBundle)

const app = new Hono()

app.get('/health', c => c.text('ok'))
app.use('*', async (c, next) => {
  const response = await handler(c.req.raw)
  if (response) {
    return response
  }
  return next()
})

export default app
```
