# Cloudflare Worker

Mokup 可以直接运行在 Worker 中，推荐使用 `@mokup/server/worker`：

## 1. 生成 Worker 产物

```bash
pnpm exec mokup build --dir mock --out worker/src/.mokup
```

## 2. Worker 入口

```ts
import { createMokupWorker } from '@mokup/server/worker'
import mokupBundle from './.mokup/mokup.bundle.mjs'

export default createMokupWorker(mokupBundle)
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
