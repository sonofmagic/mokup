# 函数处理器

当 `handler` 是函数时，Mokup 会把它视为可执行的处理器：

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

提示：可以使用 `defineHandler` 包裹路由导出以获得更好的类型提示：

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

或者使用函数写法：

```ts
import { defineHandler } from 'mokup'

export default defineHandler((c) => {
  c.header('x-mokup', 'handler')
  return c.json({ ok: true, params: c.req.param() })
})
```

函数签名：

- `c`: Hono `Context`（`c.req.param()`、`c.req.query()`、`c.req.json()`、`c.status()`、`c.header()`）

在 CLI 构建时，函数处理器会被打包到 `.mokup/mokup-handlers`，并在 manifest 中以 `module` 形式引用。
