# Server 适配器

`mokup/server/node` 提供 Node 适配器与开发服务器。Worker 请使用 `mokup/server/worker`，运行时无关的 fetch 入口请使用 `mokup/server/fetch`。

## Fetch 入口（Node）

使用场景：

- 从本地 mock 目录快速启动独立的 mock 服务。
- 在 Node 进程中嵌入一个 fetch 风格的 mock 服务。

示例：

```ts
import { createFetchServer, serve } from 'mokup/server/node'

const app = await createFetchServer({
  entries: { dir: 'mock' },
  playground: false,
})
serve({ fetch: app.fetch, port: 3000 })
```

可以直接调用 `app.fetch`：

使用场景：

- 在测试或服务内部逻辑中直接请求 mock 服务。

示例：

```ts
const response = await app.fetch(new Request('http://localhost/api/users'))
```

## 选项

使用场景：

- 在受限运行时中传入 `moduleMap`/`moduleBase`。
- 使用 `onNotFound: 'response'` 让 handler 直接返回 404。

```ts
export interface ServerOptions {
  manifest: Manifest | (() => Promise<Manifest>)
  moduleBase?: string | URL
  moduleMap?: Record<string, Record<string, unknown>>
  onNotFound?: 'next' | 'response'
}
```

`onNotFound` 默认是 `'next'`，设为 `'response'` 会直接返回 404。

Hono 适配器可在 Hono 支持的运行时中使用，Cloudflare Worker 请使用专用入口。

示例：

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

## 准备 manifest

可直接加载 CLI 生成的 bundle：

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

上面的 `options` 可直接传给任意适配器，下方示例为简洁起见直接传 `manifest`。

## Express

使用场景：

- 在现有 Express 服务中挂载 mock 路由。

示例：

```ts
import { createExpressMiddleware } from 'mokup/server/node'

app.use(createExpressMiddleware({ manifest }))
```

## Connect

使用场景：

- 兼容 Connect/legacy middleware 栈。

示例：

```ts
import { createConnectMiddleware } from 'mokup/server/node'

app.use(createConnectMiddleware({ manifest }))
```

## Koa

使用场景：

- 给 Koa 服务注入 mock 路由。

示例：

```ts
import { createKoaMiddleware } from 'mokup/server/node'

app.use(createKoaMiddleware({ manifest }))
```

## Hono

使用场景：

- 在 Hono App 中插入 Mokup mock 路由。

示例：

```ts
import { createHonoMiddleware } from 'mokup/server/node'

app.use(createHonoMiddleware({ manifest }))
```

## Fastify

使用场景：

- 通过 Fastify 插件方式接入 Mokup。

示例：

```ts
import { createFastifyPlugin } from 'mokup/server/node'

await app.register(createFastifyPlugin({ manifest }))
```

## Fetch / Worker

使用场景：

- 运行时无关的 fetch 处理（Worker、边缘运行时或自定义服务）。
- 与你自己的路由系统组合使用。

示例：

```ts
import { createFetchHandler } from 'mokup/server/fetch'

const handler = createFetchHandler({ manifest })
const response = await handler(new Request('https://example.com/api'))
```

## Worker 入口

Worker 环境（含 Cloudflare Workers）请使用 helper 入口，它基于
`mokup/server/fetch` 的 `createFetchHandler` 封装，并在 handler 返回 `null`
时统一输出 404：

使用场景：

- 以最小入口文件部署到 Cloudflare Workers。
- 自动处理 `null` 结果的 404 响应。

示例：

```ts
import { createMokupWorker } from 'mokup/server/worker'
import mokupBundle from 'virtual:mokup-bundle'

export default createMokupWorker(mokupBundle)
```
