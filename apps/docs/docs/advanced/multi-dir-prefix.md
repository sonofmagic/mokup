# Multi-Dir & Prefix

The Vite plugin supports multiple directories and prefixes:

```ts
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    mokup({
      entries: [
        { dir: 'mock', prefix: '/api' },
        { dir: 'mock-extra', prefix: '/api-extra' },
        { dir: 'mock-ignored', prefix: '/api-ignored', watch: false },
      ],
    }),
  ],
})
```

Notes:

- `dir` accepts a string or array.
- `prefix` is normalized with a leading `/`.
- All entries are merged into one route table.

For CLI builds, generate outputs per directory and combine at runtime if needed.
