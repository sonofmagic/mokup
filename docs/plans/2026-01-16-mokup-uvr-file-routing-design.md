# Mokup 基于文件路径的 Mock 路由设计（端到端）

## 目标

- 使用 UVR 风格的文件路径规则来定义 Mock API。
- 文件名必须带 HTTP 方法后缀（`.get/.post/...`）。
- dev 与 build 保持一致的解析与匹配行为。
- 将路径参数暴露给 handler 的 `req.params`。
- manifest 仍使用 v1 格式，不升级到 v2。

## 非目标

- 不支持路由分组 `(group)`。
- 不需要兼容旧的 `.mock` 文件命名。

## 命名规则（UVR 风格）

- 文件名必须包含方法后缀：`.get/.post/.put/.patch/.delete/.options/.head`。
- URL 由文件路径派生（去掉方法后缀与扩展名）。
- `index` 映射为父路径：`users/index.get.json` -> `/users`。
- 动态参数：`[id]` -> `params.id`。
- Catch-all：`[...slug]` -> `params.slug`（string[]）。
- 可选 catch-all：`[[...slug]]` -> `params.slug`（缺省为空数组）。
- `(group)` 路由分组不支持，遇到会 warn 并跳过。

## 解析与匹配

- 模板会被拆成 `static/param/catchall/optional-catchall` token。
- `catch-all` 与 `optional-catch-all` 必须位于最后一段。
- 优先级：静态 > 动态 > catch-all；更具体的路径优先。
- dev 与 build 都使用相同的 token 匹配逻辑。
- 重复路由会警告，匹配结果不建议依赖重复项顺序。

## Demo 目录结构（贯穿全文）

```txt
mock/
  users/
    me.get.json
    [id].get.ts
  reports/
    [...slug].get.ts
  docs/
    [[...slug]].get.ts
  login.post.ts
  override.get.ts
  delay.get.ts
  binary.get.ts
  _ignored/
    excluded.get.ts
mock-extra/
  batch.get.ts
```

## 开发态（Vite 插件）

### 基础接入

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
    }),
  ],
})
```

### Mock 文件写法

`mock/users/me.get.json`

```json
{
  "id": 1,
  "name": "Ada"
}
```

说明：支持 `.json` 与 `.jsonc`（允许注释与尾逗号），也支持 `.ts/.js/.mjs/.cjs`。

`mock/users/[id].get.ts`

```ts
export default {
  response: ({ params }) => ({ ok: true, id: params?.id }),
}
```

`mock/reports/[...slug].get.ts`

```ts
export default {
  response: ({ params }) => ({ path: params?.slug }),
}
```

`mock/docs/[[...slug]].get.ts`

```ts
export default {
  response: ({ params }) => ({ list: params?.slug }),
}
```

### 多规则导出（同一文件多条路由）

```ts
export default [
  { method: 'get', response: { ok: true } },
  { method: 'post', response: { created: true } },
]
```

建议每条规则显式指定 `method/url`，避免出现重复路由警告。

### 常见字段

```ts
export default {
  status: 201,
  headers: { 'x-mokup': 'ok' },
  delay: 300,
  response: { created: true },
}
```

### 覆盖派生规则

文件名派生出 `GET /override`，但可以在规则里覆盖：

```ts
export default {
  method: 'post',
  url: '/special',
  response: { ok: true },
}
```

### 二进制与文本

```ts
export default {
  response: new Uint8Array([1, 2, 3]),
}
```

```ts
export default {
  response: 'hello',
  headers: { 'content-type': 'text/plain; charset=utf-8' },
}
```

## 构建态（CLI + manifest）

### CLI 用法

```bash
mokup build \
  -d mock \
  -d mock-extra \
  -o dist \
  --prefix /api \
  --exclude "mock/_ignored"
```

输出：

- `dist/mokup.manifest.json`
- `dist/mokup-handlers/**`（当 response 为函数时生成）

### Manifest 示例（节选）

```json
{
  "version": 1,
  "routes": [
    {
      "method": "GET",
      "url": "/api/users/[id]",
      "tokens": [
        { "type": "static", "value": "api" },
        { "type": "static", "value": "users" },
        { "type": "param", "name": "id" }
      ],
      "score": [4, 4, 3],
      "source": "mock/users/[id].get.ts",
      "response": { "type": "module", "module": "./mokup-handlers/mock/users/[id].get.mjs" }
    }
  ]
}
```

## 运行时接入（Runtime）

### Node HTTP 示例

```ts
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRuntime } from '@mokup/runtime'

const manifest = JSON.parse(
  await readFile(new URL('./dist/mokup.manifest.json', import.meta.url), 'utf8'),
)

const runtime = createRuntime({
  manifest,
  moduleBase: new URL('./dist/', import.meta.url),
})

createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost')
  const result = await runtime.handle({
    method: req.method || 'GET',
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, String(v)])),
    body: undefined,
  })
  if (!result) {
    res.statusCode = 404
    res.end('Not Found')
    return
  }
  res.statusCode = result.status
  for (const [key, value] of Object.entries(result.headers)) {
    res.setHeader(key, value)
  }
  res.end(result.body ?? '')
}).listen(3000)
```

### Hono 集成示例

```ts
import { readFile } from 'node:fs/promises'
import { mokup } from '@mokup/hono'
import { Hono } from 'hono'

const manifest = JSON.parse(
  await readFile(new URL('./dist/mokup.manifest.json', import.meta.url), 'utf8'),
)

const app = new Hono()

app.use(mokup({
  manifest,
  moduleBase: new URL('./dist/', import.meta.url),
  onNotFound: 'next',
}))

export default app
```

## 行为对比（Dev vs Build）

- 解析规则一致：都使用同样的文件路径规则与 token 匹配。
- 参数一致：`params` 在 dev/build 下都可读取。
- 输出一致：`status/headers/delay` 与响应类型一致。
- 差异点：build 会生成 `manifest` 和 `mokup-handlers` 产物。

## 常见问题

- 路由分组 `(group)` 在 Mock API 中没有意义，且会导致歧义；因此直接禁止。
- 缺少方法后缀会跳过该文件并输出警告。
