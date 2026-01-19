# Handlers

When `response` is a function, Mokup treats it as an executable handler:

```ts
export default {
  response: async (c) => {
    c.status(200)
    c.header('x-mokup', 'handler')
    await new Promise(resolve => setTimeout(resolve, 120))
    return c.json({ ok: true, params: c.req.param() })
  },
}
```

Signature:

- `c`: Hono `Context` (`c.req.param()`, `c.req.query()`, `c.req.json()`, `c.status()`, `c.header()`)

When building with the CLI, handlers are bundled into `.mokup/mokup-handlers` and referenced as `module` responses in the manifest.
