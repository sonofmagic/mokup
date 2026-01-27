# Mokup：一个统一运行时的 Mock 库

我写了一个 mock 库，叫 Mokup。起因很简单：我希望一套 mock 路由能在本地开发、
Node 服务、Service Worker、Cloudflare Worker 上都能跑起来。很多 mock 工具在某个
环境里很好用，但一旦切到不同运行时就要重写。Mokup 的目标就是让这件事变得
无感、可复用。

## Mokup 能做什么

Mokup 是一个基于文件路由的 HTTP mock 库，提供统一的运行时。你只写一次 mock
文件，Mokup 就能在以下环境中运行：

- Vite dev 中间件
- 浏览器 Service Worker 模式
- Node 服务端适配器（Express / Koa / Fastify / Hono / Connect）
- Worker 运行时（fetch handler 或 Worker entry）

它提供一致的请求处理逻辑、manifest 结构，以及可复用的构建产物。

## 它是怎么工作的（1 分钟版）

1. 扫描 `mock/` 目录生成路由 manifest。
2. 运行时基于 manifest 做匹配与响应。
3. 各种适配器（Vite/Node/Worker）调用同一套运行时。
4. 在生产或 Worker 环境中，通过 bundle 把 manifest 与处理器一起打包。

一句话：一个路由模型，一个运行时，多种适配方式。

## 快速开始

先接入 Vite 插件：

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      entries: { dir: 'mock', prefix: '/api' },
    }),
  ],
}
```

新增一个 mock 处理器：

```ts
// mock/users.get.ts
export default {
  handler: c => c.json([{ id: 1, name: 'Ada' }]),
}
```

启动 Vite 后访问 `/api/users`。同一套路由可以继续在 Node 或 Worker 中复用。

## 把同一套 mock 部署到 Worker

使用 Vite 的虚拟 bundle 并接入 Worker helper：

```ts
import { createMokupWorker } from 'mokup/server/worker'
import mokupBundle from 'virtual:mokup-bundle'

export default createMokupWorker(mokupBundle)
```

或者使用 fetch handler：

```ts
import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from 'virtual:mokup-bundle'

const handler = createFetchHandler(mokupBundle)
export default { fetch: request => handler(request) }
```

## 为什么有用

- 一套 mock 源码，多端复用
- 浏览器、Node、Worker 都可运行
- 文件路由直观，维护成本低
- Service Worker 模式无需后端代理
- manifest/bundle 产物便于 CI/CD 与部署

## 适用目标

- 希望本地与预览环境一致的前端团队
- 同时在 Node 与边缘运行时部署的全栈团队
- 需要跨运行时 mock 的工具链作者
- 需要稳定、可复现数据的 QA / DX 流程

## 从哪里开始

- Vite 用户：`mokup/vite` + Service Worker 模式
- Node 服务：`mokup/server/node` 适配器
- Worker：`mokup/server/worker` 或 `mokup/server/fetch`
- CLI：`mokup build` 生成 bundle 产物

如果你希望 mock 可以随着应用一起迁移，从本地开发到边缘部署，那么 Mokup 就是
为此而生。
