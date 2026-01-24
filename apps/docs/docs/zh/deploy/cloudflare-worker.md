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

如果你更喜欢 fetch handler，可以手动装配：

```ts
import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from 'virtual:mokup-bundle'

const handler = createFetchHandler({
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: mokupBundle.moduleBase,
})

export default {
  fetch: async (request: Request) => {
    return (await handler(request)) ?? new Response('Not Found', { status: 404 })
  },
}
```
