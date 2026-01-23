# 项目概览

Mokup 是一套围绕“文件即路由”的 HTTP 框架，覆盖开发与部署两个阶段：

- **开发期**：通过 `mokup/vite` 插件，在 Vite dev 里直接拦截请求并运行路由 handler。
- **构建期**：通过 CLI 生成 `.mokup` 产物（manifest + handlers），供 Worker 或其他运行时使用。
- **运行时**：`mokup/runtime` 统一处理匹配、响应、延迟与 headers。
- **适配器**：`mokup/server` 提供 Node 适配器；`mokup/server/fetch` 运行时无关；`mokup/server/worker` 面向 Worker。

适合场景：

- 需要文件式 HTTP 路由的内部工具或生产 API。
- 希望快速验证接口并保留 mock 能力。
- 希望统一一套规则，在多种运行时中复用。

接下来请查看安装与快速开始。
