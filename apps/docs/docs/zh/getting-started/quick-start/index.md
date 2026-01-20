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
- [Node.js 服务直启](./node-server) — 通过 `dir` 直接启动独立服务。
- [Node.js 中间件](./node-middleware) — Express/Koa/Hono/Fastify 等接入构建产物。

Playground 默认在 Vite 开发与 Node.js 服务中启用，路径为 `/_mokup`。
