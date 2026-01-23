# Runtime API

`mokup/runtime` is the core matcher and response executor.

## createRuntime

```ts
import { createRuntime } from 'mokup/runtime'

const runtime = createRuntime({ manifest })
const result = await runtime.handle({
  method: 'GET',
  path: '/users',
  query: {},
  headers: {},
  body: undefined,
})
```

## Direct usage with CLI bundle

Use the CLI bundle to load a manifest and handler module map in your runtime:

```bash
pnpm exec mokup build --dir mock --out .mokup
```

```ts
import { createRuntime } from 'mokup/runtime'
import mokupBundle from './.mokup/mokup.bundle.mjs'

const runtime = createRuntime({
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: mokupBundle.moduleBase,
})
```

If you are not bundling handlers, you can omit `moduleMap` and `moduleBase`.

## createRuntimeApp

Build a Hono app from the manifest (useful for Service Worker or custom fetch handlers).

```ts
import { createRuntimeApp } from 'mokup/runtime'

const app = await createRuntimeApp({ manifest })
const response = await app.fetch(new Request('http://localhost/api/users'))
```

## Service Worker helper

`mokup/runtime` also re-exports `handle` from `hono/service-worker`.

```ts
import { createRuntimeApp, handle } from 'mokup/runtime'

const app = await createRuntimeApp({ manifest })
globalThis.addEventListener('fetch', handle(app))
```

## RuntimeOptions

```ts
export interface RuntimeOptions {
  manifest: Manifest | (() => Promise<Manifest>)
  moduleBase?: string | URL
  moduleMap?: Record<string, Record<string, unknown>>
}
```

`moduleMap` is required for Worker-like environments where you cannot import local files directly.
