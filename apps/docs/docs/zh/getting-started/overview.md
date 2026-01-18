# 项目概览

Mokup 是一套围绕“文件即路由”的本地 Mock 工具链，覆盖开发与部署两个阶段：

- **开发期**：通过 `mokup/vite` 插件，在 Vite dev 里直接拦截请求并返回 mock 响应。
- **构建期**：通过 CLI 生成 `.mokup` 产物（manifest + handlers），供 Worker 或其他运行时使用。
- **运行时**：`@mokup/runtime` 统一处理匹配、响应、延迟与 headers。
- **适配器**：`@mokup/server` 提供 Express/Koa/Hono/Fastify/Fetch 等中间件。

适合场景：

- 前后端并行开发，需要稳定 mock。
- 将 mock 作为可部署资产（例如 Worker）用于演示或集成测试。
- 希望统一一套规则，在多种框架中复用。

接下来请查看安装与快速开始。
