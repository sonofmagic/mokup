# Middleware Ordering & defineConfig

Directory configs can register middleware with `defineConfig`. The middleware stages are `pre`, `normal`, and `post`.

## defineConfig in index.config.ts

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

## Ordering rules

- Directory chain runs from root to nested directories.
- Stage order per route: `pre` -> `normal` -> `post` -> handler.
- Use `await next()` to run logic after later middleware and the handler.

## Nested directory example

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

## Object configs and legacy middleware

- `pre/normal/post` require `defineConfig`.
- Plain object configs only support directory fields like `headers`, `status`, `delay`, `include`, and `exclude`.
- `middleware` is a legacy field and behaves like the `normal` stage.

## Example map (apps/docs/mock)

- `apps/docs/mock/example-basic`: minimal `pre/normal/post` ordering.
- `apps/docs/mock/example-order`: parent + nested ordering chain.
- `apps/docs/mock/example-auth`: auth check in `pre` with headers in `post`.
- `apps/docs/mock/example-metrics`: request duration and request id headers.
- `apps/docs/mock/example-headers`: header overrides by stage.
- `apps/docs/mock/example-errors`: error handling in `post`.
- `apps/docs/mock/example-delay-status`: delay and status behavior.
