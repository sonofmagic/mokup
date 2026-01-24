# 中间件顺序与 defineConfig

目录配置可以通过 `defineConfig` 注册中间件。中间件阶段为 `pre`、`normal`、`post`。

## index.config.ts 使用 defineConfig

```ts
import type { MiddlewareHandler } from 'mokup'
import { defineConfig } from 'mokup'

const requireAuth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header('authorization') ?? ''
  if (!header.startsWith('Bearer ')) {
    c.status(401)
    return c.json({ ok: false, error: 'missing_auth' })
  }
  await next()
}

export default defineConfig(({ pre, normal, post }) => {
  pre.use(requireAuth)

  normal.use(async (c, next) => {
    c.header('x-mokup-normal', '1')
    await next()
  })

  post.use(async (c, next) => {
    await next()
    c.header('x-mokup-post', '1')
  })

  return {
    headers: { 'x-mokup-example': 'ordering' },
  }
})
```

## defineHandler 用于路由文件

`defineHandler` 可以在 JS/TS 中提供类型提示，无需额外 JSDoc。

```ts
import { defineHandler } from 'mokup'

export default defineHandler((c) => {
  return { ok: true, method: c.req.method }
})
```

```ts
import { defineHandler } from 'mokup'

export default defineHandler({
  enabled: false,
  handler: async (c) => {
    return { ok: false, reason: 'disabled-rule', method: c.req.method }
  },
})
```

## 顺序规则

- 目录链条按从根目录到子目录依次生效。
- 单个路由的阶段顺序：`pre` -> `normal` -> `post` -> handler。
- 使用 `await next()` 可以在后续中间件和 handler 执行后继续处理。

## 目录嵌套示例

```
mock/
  index.config.ts
  nested/
    index.config.ts
    info.get.ts
```

```ts
// mock/index.config.ts
import { defineConfig } from 'mokup'

export default defineConfig(({ pre }) => {
  pre.use(async (c, next) => {
    c.header('x-root-pre', '1')
    await next()
  })
})
```

```ts
// mock/nested/index.config.ts
import { defineConfig } from 'mokup'

export default defineConfig(({ post }) => {
  post.use(async (c, next) => {
    await next()
    c.header('x-nested-post', '1')
  })
})
```

## object 配置与旧字段

- `pre/normal/post` 只能在 `defineConfig` 内使用。
- 直接导出 object 仅支持 `headers`、`status`、`delay`、`include`、`exclude` 等目录字段。
- `middleware` 是旧字段，行为等同于 `normal` 阶段。

## 示例目录（apps/docs/mock）

- `apps/docs/mock/example-basic`: 最小化 `pre/normal/post` 顺序。
- `apps/docs/mock/example-order`: 父目录 + 子目录的顺序链。
- `apps/docs/mock/example-auth`: `pre` 鉴权与 `post` 响应头。
- `apps/docs/mock/example-metrics`: 请求耗时与 request id 响应头。
- `apps/docs/mock/example-headers`: 不同阶段的响应头覆盖。
- `apps/docs/mock/example-errors`: `post` 中处理异常。
- `apps/docs/mock/example-delay-status`: 延迟与状态码。
