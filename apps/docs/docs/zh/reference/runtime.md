# Runtime API

`mokup/runtime` 是路由匹配与响应处理的核心。

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

## RuntimeOptions

```ts
export interface RuntimeOptions {
  manifest: Manifest | (() => Promise<Manifest>)
  moduleBase?: string | URL
  moduleMap?: Record<string, Record<string, unknown>>
}
```

`moduleMap` 用于 Worker 等无法动态 import 本地文件的场景，通常由 `mokup.bundle.mjs` 生成。
