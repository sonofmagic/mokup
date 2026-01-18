# Cloudflare Worker

Run Mokup in Workers with `@mokup/server/worker`.

## 1. Build outputs

```bash
pnpm exec mokup build --dir mock --out worker/src/.mokup
```

## 2. Worker entry

```ts
import { createMokupWorker } from '@mokup/server/worker'
import mokupBundle from './.mokup/mokup.bundle.mjs'

export default createMokupWorker(mokupBundle)
```

## 3. Wrangler config

```jsonc
{
  "name": "web-mokup-worker",
  "main": "worker/src/index.ts",
  "compatibility_date": "2025-01-15"
}
```

No extra `moduleBase` or `moduleMap` wiring is required when using the bundle.
