# Vite 项目集成 Mokup（完整示例版）

本文档面向 Vite 项目，提供从 0 到 1 的 Mokup 集成方式，并通过大量示例展示文件路由、handler、参数解析、响应控制等完整用法。

## 快速开始

### 安装

```bash
pnpm add mokup -D
```

### Vite 配置

```ts
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    mokup({
      dir: ['mock', 'mock-extra'],
      prefix: '/api',
      exclude: [/mock\/_ignored/],
      watch: true,
      log: true,
    }),
  ],
})
```

### 目录结构示例

```txt
mock/
  users/
    index.get.json
    me.get.json
    [id].get.ts
  reports/
    [...slug].get.ts
  docs/
    [[...slug]].get.ts
  login.post.ts
  search.get.ts
  override.get.ts
  health.get.ts
  about.get.jsonc
  _ignored/
    excluded.get.ts
mock-extra/
  batch.get.ts
```

## 文件路由规则（UVR 风格）

### 方法后缀（必填）

文件名必须包含 HTTP 方法后缀：`.get/.post/.put/.patch/.delete/.options/.head`
示例：`mock/users/me.get.json` -> `GET /users/me`

### index 归并

`mock/users/index.get.json` -> `GET /users`

### 动态参数

`mock/users/[id].get.ts` -> `GET /users/:id`
`req.params.id` 为字符串。

### Catch-all 与可选 Catch-all

`mock/reports/[...slug].get.ts` -> `/reports/*`，`req.params.slug` 为字符串数组。
`mock/docs/[[...slug]].get.ts` -> `/docs` 或 `/docs/a/b`，缺省时数组为空。

### 路由优先级

静态 > 动态 > catch-all，路径越具体优先级越高。

### 路由分组

不支持 `(group)`，出现会被跳过并告警。

## Mock 文件类型

### JSON / JSONC

`mock/about.get.jsonc`

```jsonc
{
  // JSONC 支持注释与尾逗号
  "version": "0.1.0",
  "mission": "Mock APIs at lightspeed"
}
```

### TS/JS 模块

支持导出对象、数组、函数。函数式响应建议显式声明 `MockResponseHandler`。

## Handler 约定（强烈推荐）

函数响应必须明确类型，避免 `req` 隐式 `any`：

```ts
import type { MockResponseHandler, MockRule } from 'mokup'

const handler: MockResponseHandler = (req, res, ctx) => {
  res.setHeader('x-mokup', 'ok')
  return { ok: true }
}

const rule: MockRule = {
  response: handler,
}

export default rule
```

## 基础路由示例（完整 handler）

### 静态路由

`mock/health.get.ts`

```ts
import type { MockRule } from 'mokup'

const rule: MockRule = {
  response: 'OK',
}

export default rule
```

### 动态参数

`mock/users/[id].get.ts`

```ts
import type { MockResponseHandler, MockRule } from 'mokup'

const handler: MockResponseHandler = (req) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : undefined
  return {
    ok: true,
    id,
    params: req.params ?? {},
  }
}

const rule: MockRule = {
  response: handler,
}

export default rule
```

### Catch-all

`mock/reports/[...slug].get.ts`

```ts
import type { MockResponseHandler, MockRule } from 'mokup'

const handler: MockResponseHandler = (req) => {
  const slug = Array.isArray(req.params?.slug) ? req.params?.slug : []
  return {
    ok: true,
    slug,
    trail: slug.join('/'),
  }
}

const rule: MockRule = {
  response: handler,
}

export default rule
```

### 可选 Catch-all

`mock/docs/[[...slug]].get.ts`

```ts
import type { MockResponseHandler, MockRule } from 'mokup'

const handler: MockResponseHandler = (req) => {
  const slug = Array.isArray(req.params?.slug) ? req.params?.slug : []
  return {
    ok: true,
    slug,
    empty: slug.length === 0,
  }
}

const rule: MockRule = {
  response: handler,
}

export default rule
```

## 行为示例（响应控制）

### 延迟与 Header

`mock/search.get.ts`

```ts
import type { MockResponseHandler, MockRule } from 'mokup'

const handler: MockResponseHandler = async (req, res, ctx) => {
  await ctx.delay(220)
  const query = req.query.q
  const term = Array.isArray(query) ? query[0] : query
  res.setHeader('x-mokup-query', String(term ?? ''))
  const pageValue = req.query.page
  const pageText = Array.isArray(pageValue) ? pageValue[0] : pageValue
  return {
    term: term ?? 'none',
    page: Number(pageText ?? 1),
    results: [
      { id: 1, label: `${term ?? 'signal'}-alpha` },
      { id: 2, label: `${term ?? 'signal'}-beta` },
    ],
  }
}

const rule: MockRule = {
  response: handler,
}

export default rule
```

### 状态码与鉴权

`mock/login.post.ts`

```ts
import type { MockResponseHandler, MockRule } from 'mokup'

const handler: MockResponseHandler = async (req, res, ctx) => {
  await ctx.delay(150)
  const payload = (req.body ?? {}) as { username?: string, password?: string }
  if (payload.username === 'mokup' && payload.password === '123456') {
    return {
      ok: true,
      message: 'Access granted. Welcome to the mock channel.',
      token: 'mock-token-7d91',
    }
  }
  res.statusCode = 401
  return {
    ok: false,
    message: 'Invalid credentials.',
    hint: 'Try mokup / 123456',
  }
}

const rule: MockRule = {
  url: '/login',
  method: 'post',
  response: handler,
}

export default rule
```

### 规则覆盖（method/url）

```ts
import type { MockRule } from 'mokup'

const rule: MockRule = {
  method: 'patch',
  url: '/override',
  response: {
    ok: true,
    message: 'Method overridden by rule.method.',
  },
}

export default rule
```

### 二进制响应

```ts
import type { MockRule } from 'mokup'

const rule: MockRule = {
  response: new Uint8Array([1, 2, 3, 4]),
}

export default rule
```

### 多规则导出

```ts
import type { MockRule } from 'mokup'

const rules: MockRule[] = [
  { method: 'get', response: { ok: true } },
  { method: 'post', response: { created: true } },
]

export default rules
```

## 请求对象字段说明

`MockResponseHandler` 的参数如下：

```ts
type MockResponseHandler = (req, res, ctx) => unknown | Promise<unknown>
```

`req` 字段重点：

- `req.params`: `Record<string, string | string[]>`
- `req.query`: `Record<string, string | string[]>`
- `req.body`: 解析后的 body（json、form 或 raw）
- `req.rawBody`: 原始字符串（可选）

`res` 用于设置状态码与头部，`ctx.delay(ms)` 可模拟延迟。

## 高级配置

### 多目录扫描

```ts
mokup({
  dir: ['mock', 'mock-extra'],
})
```

### prefix

```ts
mokup({
  prefix: '/api',
})
```

### include/exclude

```ts
mokup({
  include: [/mock/],
  exclude: [/mock\/_ignored/],
})
```

### 关闭 watch/log

```ts
mokup({
  watch: false,
  log: false,
})
```

## 常见问题

### 没有方法后缀？

会被跳过并告警。请确保文件名类似 `users.get.ts`。

### 路由冲突？

相同 `method + url` 会告警，实际匹配顺序不建议依赖冲突项。

### `req` 报 TS7006？

函数响应请显式声明 `MockResponseHandler`，不要直接写 `(req) => ...`。
