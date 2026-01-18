# 函数处理器

当 `response` 是函数时，Mokup 会把它视为可执行的处理器：

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

函数签名：

- `req`: 请求信息（`method`, `path`, `query`, `headers`, `body`, `params`）
- `res`: 响应控制器（`statusCode`, `setHeader`, `removeHeader`）
- `ctx`: 辅助工具（`delay(ms)`, `json(data)`）

在 CLI 构建时，函数处理器会被打包到 `.mokup/mokup-handlers`，并在 manifest 中以 `module` 形式引用。
