# Runtime API

`@mokup/runtime` is the core matcher and response executor.

## createRuntime

```ts
import { createRuntime } from '@mokup/runtime'

const runtime = createRuntime({ manifest })
const result = await runtime.handle({
  method: 'GET',
  path: '/users',
  query: {},
  headers: {},
  body: undefined,
})
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
