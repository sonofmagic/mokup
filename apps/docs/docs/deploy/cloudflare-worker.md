# Cloudflare Worker

Run Mokup in Workers with `mokup/server/fetch`. The `mokup/server/worker` entry
is still available for a more compact Worker wrapper.

## 1. Build outputs

```bash
pnpm exec mokup build --dir mock --out worker/src/.mokup
```

## 2. Worker entry (fetch handler)

```ts
import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from './.mokup/mokup.bundle.mjs'

const handler = createFetchHandler({
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: mokupBundle.moduleBase,
})

export default {
  fetch: async (request: Request) => {
    return (await handler(request)) ?? new Response('Not Found', { status: 404 })
  },
}
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

If you prefer the Worker helper, use it as a thin wrapper around
`createFetchHandler` that returns 404 on `null`:

```ts
import { createMokupWorker } from 'mokup/server/worker'
import mokupBundle from './.mokup/mokup.bundle.mjs'

export default createMokupWorker(mokupBundle)
```
