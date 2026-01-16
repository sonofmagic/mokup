# mokup

Mock utilities and a Vite plugin for local API mocking.

## Vite plugin

```ts
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    mokup({
      dir: 'mock',
      prefix: '',
    }),
  ],
})
```

## Mock files

Filenames must include an HTTP method suffix (`.get`, `.post`, etc.).

`mock/user.get.json`

```json
{
  "id": 1,
  "name": "Ada"
}
```

`mock/auth.post.ts`

```ts
export default {
  response: ({ body }) => {
    if (body && typeof body === 'object' && 'username' in body) {
      return { ok: true }
    }
    return { ok: false }
  },
}
```

`mock/users/[id].get.ts`

```ts
export default {
  response: ({ params }) => ({ ok: true, id: params?.id }),
}
```
