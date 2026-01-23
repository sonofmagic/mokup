# Vite 快速开始

## 1. 安装

```bash
pnpm add -D mokup
```

## 2. 启用插件

```ts
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    mokup({
      entries: {
        dir: 'mock',
        prefix: '/api',
      },
    }),
  ],
})
```

## 3. 启动开发服务

```bash
pnpm dev
```

## 4. 验证

- `http://localhost:5173/api/users`
- `http://localhost:5173/__mokup`

## 下一步

完整选项请参考 [Vite 插件](/zh/reference/vite-plugin)。
