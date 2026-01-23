# Cloudflare Worker

Mokup 可以直接运行在 Worker 中，推荐使用 `mokup/server/fetch`。如需更简洁的
Worker 封装，也可使用 `mokup/server/worker`。

## 1. 生成 Worker 产物

```bash
pnpm exec mokup build --dir mock --out worker/src/.mokup
```

## 2. Worker 入口（fetch handler）

```ts
import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from './.mokup/mokup.bundle.mjs'

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

## 3. Wrangler 配置

`wrangler.jsonc` 示例：

```jsonc
{
  "name": "web-mokup-worker",
  "main": "worker/src/index.ts",
  "compatibility_date": "2025-01-15"
}
```

Worker 入口只依赖 `mokup.bundle.mjs`，无需手动传入 `moduleBase` 或 `moduleMap`。

如果你更喜欢 Worker helper，它是对 `createFetchHandler` 的轻量封装，
在返回 `null` 时统一输出 404，可以使用：

```ts
import { createMokupWorker } from 'mokup/server/worker'
import mokupBundle from './.mokup/mokup.bundle.mjs'

export default createMokupWorker(mokupBundle)
```
