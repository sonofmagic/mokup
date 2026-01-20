# Node.js Dev Server Quick Start

## 1. Install

```bash
pnpm add mokup
```

## 2. Start the server (programmatic)

```ts
import { startMokupServer } from 'mokup/server'

await startMokupServer({
  dir: 'mock',
  prefix: '/api',
  port: 3000,
})
```

## 3. Or use the CLI

```bash
pnpm exec mokup serve --dir mock --prefix /api --port 3000
```

## 4. Verify

- `http://localhost:3000/api/users`
- `http://localhost:3000/_mokup`

## Next

The server supports `watch`, `playground`, `include`, and `exclude`. See [Server Adapters](/reference/server) for details.
