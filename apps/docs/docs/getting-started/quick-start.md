# Quick Start

## 1. Create a mock file

Create `mock/users.get.json`:

```json
{
  "id": 1,
  "name": "Ada"
}
```

## 2. Enable the Vite plugin

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

## 3. Run dev server

```bash
pnpm dev
```

Visit `http://localhost:5173/api/users` to see your JSON.

## 4. Open Playground

```
http://localhost:5173/_mokup
```

Playground lists all routes and supports live refresh.
