# Node.js 服务直启

## 1. 安装

```bash
pnpm add mokup
```

## 2. 程序内启动

```ts
import { startMokupServer } from 'mokup/server'

await startMokupServer({
  dir: 'mock',
  prefix: '/api',
  port: 3000,
})
```

## 3. 或使用 CLI

```bash
pnpm exec mokup serve --dir mock --prefix /api --port 3000
```

## 4. 验证

- `http://localhost:3000/api/users`
- `http://localhost:3000/_mokup`

## 下一步

可配置 `watch`、`playground`、`include`、`exclude` 等选项，详见 [Server 适配器](/zh/reference/server)。
