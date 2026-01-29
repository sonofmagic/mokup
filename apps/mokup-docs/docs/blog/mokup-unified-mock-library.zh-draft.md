# Mokup：一个统一运行时的 Mock 库（草稿）

大家好呀，我是 icebreaker, 是一名前端开发者兼开源爱好者。我的 Github 是 https://github.com/sonofmagic

今天想跟大家分享我最近新写的一个 js 项目 —— Mokup，一个强调“统一运行时”的 HTTP mock 库。

## 为什么写 Mokup

我写 Mokup 的起点很简单：我希望前端工程师在本地开发时能有更好的 mock 体验，同时又能让这些 mock 逻辑无缝迁移到服务端或边缘环境中去。

另外我也希望我团队里的一些纯前端小伙伴们，可以快速的进行全栈的开发。

经过一段时间的探索和实践，Mokup 应运而生。

希望同一套 mock 路由在本地开发、Node 服务、浏览器
Service Worker、Cloudflare Worker 上都能跑起来。

很多 mock 工具在单一环境里体验很好，但一旦跨到浏览器/服务器/边缘，就容易出现“写一次、改三次”的割裂。

对前端来说，这意味着调试和联调成本变高；对选型者来说，这意味着维护成本不可控。

Mokup 的目标就是把这件事变得统一、可复用、可迁移。

## Mokup 是什么

Mokup 是一个基于文件路由的 HTTP mock 库，强调“统一运行时”。你把 mock 文件
放在 `mock/` 目录下，Mokup 会扫描生成 manifest，由同一套 runtime 来匹配请求
并输出响应。换句话说：写一次，跑 everywhere。

覆盖场景包括：

- Vite/Webpack dev server 中间件（前端本地开发）
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

## 可视化 Playground（重点）

Mokup 内置了一个可视化的 Playground，用来浏览与调试当前扫描到的 mock 路由。
在 Vite 开发时默认访问路径为：

```
http://localhost:5173/__mokup
```

你可以在页面里看到分组后的路由列表、方法/路径信息、以及每个路由对应的目录配置链。
这对前端联调非常有帮助：不用翻文件就能快速确认某个接口是否被扫描、是否被禁用、是否被目录配置覆盖。
当你新增或修改 mock 文件时，Playground 会自动刷新路由列表，调试成本非常低。

如果你希望自定义入口或关闭 Playground，也可以在插件配置里设置：

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      entries: { dir: 'mock', prefix: '/api' },
      playground: { path: '/__mokup', enabled: true },
    }),
  ],
}
```

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

Mokup 的定位不是“替代所有 mock 方案”，而是让 mock 能在更多环境里保持一致，
这对大型前端工程与选型决策更重要。
