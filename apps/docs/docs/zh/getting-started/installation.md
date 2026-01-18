# 安装

## 前置要求

- Node.js 20+
- pnpm（推荐）

## 安装依赖

Vite 插件（开发期 mock）：

```bash
pnpm add -D mokup
```

CLI（生成 `.mokup` 产物）：

```bash
pnpm add -D @mokup/cli
```

Server/Worker 运行时（部署或中间件）：

```bash
pnpm add @mokup/server @mokup/runtime
```

如果你只做本地 Vite 开发，只需要 `mokup` 即可。
