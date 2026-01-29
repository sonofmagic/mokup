# Handlers

When `handler` is a function, Mokup treats it as an executable handler:

```ts
export default {
  handler: async (c) => {
    c.status(200)
    c.header('x-mokup', 'handler')
    await new Promise(resolve => setTimeout(resolve, 120))
    return c.json({ ok: true, params: c.req.param() })
  },
}
```

Tip: you can wrap route exports with `defineHandler` for better IntelliSense:

```ts
import { defineHandler } from 'mokup'

export default defineHandler({
  handler: async (c) => {
    c.status(200)
    c.header('x-mokup', 'handler')
    await new Promise(resolve => setTimeout(resolve, 120))
    return c.json({ ok: true, params: c.req.param() })
  },
})
```

Or use the function form:

```ts
import { defineHandler } from 'mokup'

export default defineHandler((c) => {
  c.header('x-mokup', 'handler')
  return c.json({ ok: true, params: c.req.param() })
})
```

Signature:

- `c`: Hono `Context` (`c.req.param()`, `c.req.query()`, `c.req.json()`, `c.status()`, `c.header()`)

When building with the CLI, handlers are bundled into `.mokup/mokup-handlers` and referenced as `module` responses in the manifest.
