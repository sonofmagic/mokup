# 常见问题

## 为什么 JSON Mock 需要 method 后缀？

CLI 构建使用文件名判断方法，推荐显式使用 `.get/.post` 等后缀。Vite 插件对 `.json/.jsonc` 会默认 `GET`，但仍建议显式声明以保持一致性。

## Worker 下出现 node 内置模块警告

请确保使用 `@mokup/server/worker` 入口，而不是 `@mokup/server`，避免 Node 专用依赖被打包进 Worker。

## Playground 里看不到数据

确认：

- Vite 插件已启用。
- 访问路径为 `/_mokup`（或你自定义的路径）。
- mock 文件命名正确且有 method 后缀。

## JSON 能不能写注释？

可以，`.jsonc` 支持注释与尾逗号。
