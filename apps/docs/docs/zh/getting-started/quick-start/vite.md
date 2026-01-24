# Vite 快速开始

## 1. 安装

::: code-group

```bash [pnpm]
pnpm add -D mokup
```

```bash [npm]
npm install -D mokup
```

```bash [yarn]
yarn add -D mokup
```

```bash [bun]
bun add -d mokup
```

:::

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

::: code-group

```bash [pnpm]
pnpm dev
```

```bash [npm]
npm run dev
```

```bash [yarn]
yarn dev
```

```bash [bun]
bun run dev
```

:::

## 4. 验证

- `http://localhost:5173/api/users`
- `http://localhost:5173/__mokup`

## 下一步

完整选项请参考 [Vite 插件](/zh/reference/vite-plugin)。
