# Cloudflare

Mokup 可以运行在 Cloudflare Workers 或 Pages 上。Workers 适合 API 请求，
Pages 更适合静态站点 + Functions 的组合。

## 入口选择

- `mokup/server/worker`: 最简 Worker 包装，适合直接部署。
- `mokup/server/fetch`: 手动组装 fetch 处理器，方便自定义路由。

## Workers 快速开始

使用 `mokup/vite` 时，可以直接导入 Vite 生成的虚拟 bundle：

```ts
import { createMokupWorker } from 'mokup/server/worker'
import mokupBundle from 'virtual:mokup-bundle'

export default createMokupWorker(mokupBundle)
```

### Wrangler 配置

```jsonc
{
  "name": "mokup-worker",
  "main": "worker/src/index.ts",
  "compatibility_date": "2025-01-15"
}
```

### 构建与部署

```bash
vite build
wrangler deploy
```

## Pages Functions 快速开始

在 `functions/[[path]].ts` 中添加函数入口，然后复用同一套 fetch handler：

```ts
import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from 'virtual:mokup-bundle'

const handler = createFetchHandler(mokupBundle)

export const onRequest: PagesFunction = async ({ request }) => {
  return (await handler(request)) ?? new Response('Not Found', { status: 404 })
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

构建站点并部署到 Pages：

```bash
vite build
wrangler pages deploy dist
```

## 更多细节

更多部署细节请参考
[Cloudflare Worker](../deploy/cloudflare-worker)。
