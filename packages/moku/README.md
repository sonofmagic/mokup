# moku

Mock utilities and a Vite plugin for local API mocking.

## Vite plugin

```ts
import moku from 'moku/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    moku({
      dir: 'mock',
      prefix: '',
    }),
  ],
})
```

## Mock files

`mock/user.get.json`

```json
{
  "id": 1,
  "name": "Ada"
}
```

`mock/auth.ts`

```ts
export default {
  url: '/login',
  method: 'post',
  response: ({ body }) => {
    if (body && typeof body === 'object' && 'username' in body) {
      return { ok: true }
    }
    return { ok: false }
  },
}
```
