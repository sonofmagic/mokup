# Handlers

When `response` is a function, Mokup treats it as an executable handler:

```ts
export default {
  response: async (req, res, ctx) => {
    res.statusCode = 200
    res.setHeader('x-mokup', 'handler')
    await ctx.delay(120)
    return ctx.json({ ok: true, params: req.params })
  },
}
```

Signature:

- `req`: request info (`method`, `path`, `query`, `headers`, `body`, `params`)
- `res`: response controller (`statusCode`, `setHeader`, `removeHeader`)
- `ctx`: helpers (`delay(ms)`, `json(data)`)

When building with the CLI, handlers are bundled into `.mokup/mokup-handlers` and referenced as `module` responses in the manifest.
