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

## 直接使用 CLI bundle

可直接加载 CLI 生成的 bundle：

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

如果没有打包函数处理器，可以省略 `moduleMap` 与 `moduleBase`。

## createRuntimeApp

根据 manifest 构建 Hono app（适用于 Service Worker 或自定义 fetch 处理）。

```ts
import { createRuntimeApp } from 'mokup/runtime'

const app = await createRuntimeApp({ manifest })
const response = await app.fetch(new Request('http://localhost/api/users'))
```

## Service Worker helper

`mokup/runtime` 也会导出 `hono/service-worker` 的 `handle`。

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

`moduleMap` 用于 Worker 等无法动态 import 本地文件的场景，通常由 `mokup.bundle.mjs` 生成。
