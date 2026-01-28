# Mokup：一个统一运行时的 Mock 库（草稿）

我写 Mokup 的起点很简单：希望同一套 mock 路由在本地开发、Node 服务、浏览器
Service Worker、Cloudflare Worker 上都能跑起来。很多 mock 工具在单一环境里
体验很好，但一旦跨到浏览器/服务器/边缘，就容易出现“写一次、改三次”的割裂。
对前端来说，这意味着调试和联调成本变高；对选型者来说，这意味着维护成本不可控。
Mokup 的目标就是把这件事变得统一、可复用、可迁移。

## Mokup 是什么

Mokup 是一个基于文件路由的 HTTP mock 库，强调“统一运行时”。你把 mock 文件
放在 `mock/` 目录下，Mokup 会扫描生成 manifest，由同一套 runtime 来匹配请求
并输出响应。换句话说：写一次，跑 everywhere。

覆盖场景包括：

- Vite dev server 中间件（前端本地开发）
- 浏览器 Service Worker（接近真实网络行为）
- Node 服务端适配器（Express/Koa/Fastify/Hono/Connect）
- Worker 运行时（Cloudflare Worker 等边缘环境）

## 一分钟了解它如何工作

1. 扫描 `mock/` 目录，生成路由 manifest。
2. runtime 使用 manifest 匹配请求并执行响应逻辑。
3. 各种适配器（Vite/Node/Worker）共享同一套 runtime。
4. 生产环境可直接复用构建产物（manifest + handler bundle）。

这意味着：路由规则一致、响应逻辑一致、部署方式可选。

## 快速开始（Vite）

接入 Vite 插件：

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

编写 mock 处理器：

```ts
// mock/users.get.ts
export default {
  handler: c => c.json([{ id: 1, name: 'Ada' }]),
}
```

提示：可以使用 `defineHandler` 包裹导出以获得更好的类型提示：

```ts
import { defineHandler } from 'mokup'

export default defineHandler({
  handler: c => c.json([{ id: 1, name: 'Ada' }]),
})
```

启动 Vite 并访问 `/api/users`，你会得到一份真实可用的响应。之后这套路由还能
直接迁移到 Node 或 Worker，无需重写。

## 同一套 mock 部署到 Worker

如果你希望把本地 mock 迁移到 Worker 运行时，可以用构建产物和 Worker helper：

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

这样你就能在边缘环境复用本地的 mock 逻辑，避免多套实现。

## 适用场景与边界

适合：

- 需要“前端与服务端 mock 一致性”的团队或项目
- 希望 mock 能随环境迁移（本地/Node/Worker）的应用
- 追求可维护性的 mock 体系（统一路由规则与响应逻辑）

不太适合：

- 强依赖复杂动态代理/转发的场景
- 希望完全由浏览器注入、无构建流程的轻量 mock
- 对运行时体积极度敏感、又不愿做拆分的项目

## 与现有方案的对比与取舍

相比只在浏览器侧生效的 mock，Mokup 的优势是“跨环境一致性”，缺点是需要
构建产物与 runtime 依赖。相比只在 Node 中间件侧生效的 mock，Mokup 的优势是
能覆盖前端调试与 Worker 部署，缺点是需要维护一套更通用的路由与响应模型。

如果你的团队更看重“统一性”和“可迁移性”，Mokup 会明显降低长期维护成本；
如果你的场景只需要单端 mock，则简单方案可能更轻量。

## 路线图（草案）

- 更丰富的可视化与调试体验（Playground 进一步增强）
- 更清晰的工程化产物（Bundle/Manifest 管理工具）
- 更多生态适配（框架与构建工具的扩展）

Mokup 的定位不是“替代所有 mock 方案”，而是让 mock 能在更多环境里保持一致，
这对大型前端工程与选型决策更重要。
