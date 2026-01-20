# Node.js 中间件快速开始

适合将 Mokup 接入现有的 Node.js 服务框架。

## 1. 构建 manifest

```bash
pnpm exec mokup build --dir mock --out .mokup
```

## 2. 加载 bundle

```ts
import mokupBundle from './.mokup/mokup.bundle.mjs'

export const mokupOptions = {
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: new URL('./.mokup/', import.meta.url),
}
```

## 3. 挂载中间件

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

## 说明

- Mock 文件变更后需要重新执行 `mokup build`，或使用 [Node.js 服务直启](./node-server) 获得实时监听。
- 设置 `onNotFound: 'response'` 可在未命中时直接返回 404。
