# Vite Quick Start

## 1. Install

```bash
pnpm add -D mokup
```

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

```bash
pnpm dev
```

## 4. Verify

- `http://localhost:5173/api/users`
- `http://localhost:5173/__mokup`

## Next

See the full options in [Vite Plugin](/reference/vite-plugin).
