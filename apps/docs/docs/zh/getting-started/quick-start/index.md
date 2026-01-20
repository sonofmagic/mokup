# 快速开始

选择适合你的启动方式，所有流程共用同一套 mock 文件。

## 1. 创建 mock 文件

在项目根目录创建 `mock/users.get.json`：

```json
{
  "id": 1,
  "name": "Ada"
}
```

## 2. 选择路径

- [Vite 插件](./vite) — 适合 Vite 开发与预览。
- [Webpack 插件](./webpack) — 集成 webpack-dev-server。
- [Hono 适配器](/zh/reference/server#hono) — 在 Hono 运行时中使用。
- [Cloudflare Worker](/zh/deploy/cloudflare-worker) — 使用 Worker 入口部署。
- [Node.js API](../node-api) — 在 Node 中直接调用 runtime。
- [服务端中间件](../server-middleware) — 接入已有服务端。

Playground 默认在 Vite 开发中启用，路径为 `/_mokup`。
