# 快速开始

## 1. 创建 mock 文件

在项目根目录创建 `mock/users.get.json`：

```json
{
  "id": 1,
  "name": "Ada"
}
```

## 2. 启用 Vite 插件

```ts
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    mokup({
      dir: 'mock',
      prefix: '/api',
    }),
  ],
})
```

## 3. 启动开发服务

```bash
pnpm dev
```

访问 `http://localhost:5173/api/users` 应该返回你的 JSON。

## 4. 打开 Playground

默认入口为 `/_mokup`：

```
http://localhost:5173/_mokup
```

Playground 会展示所有已加载的 mock 路由，支持调试与热更新。
