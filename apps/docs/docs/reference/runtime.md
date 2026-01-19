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
