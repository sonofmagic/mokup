# Vite Quick Start

## 1. Install

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

## 2. Enable the plugin

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

## 3. Start dev server

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

## 4. Verify

- `http://localhost:5173/api/users`
- `http://localhost:5173/__mokup`

## Next

See the full options in [Vite Plugin](/reference/vite-plugin).
