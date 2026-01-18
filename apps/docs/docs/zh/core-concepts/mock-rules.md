# Mock 规则

一个 mock 文件可以导出单条或多条规则。规则字段如下：

- `response`: 响应内容（必填）
- `status`: 状态码
- `headers`: 响应头
- `delay`: 延迟毫秒数
- `method`: 覆盖文件方法
- `url`: 覆盖路由路径

## JSON / JSONC

直接返回 JSON 内容，支持注释与尾逗号：

```jsonc
{
  // user profile
  "id": 1,
  "name": "Ada"
}
```

## TS/JS

导出对象或数组：

```ts
export default {
  status: 201,
  headers: { 'x-mock': 'ok' },
  response: { ok: true },
}
```

多规则：

```ts
export default [
  { method: 'get', url: '/users', response: [] },
  { method: 'post', url: '/users', response: { ok: true } },
]
```

## 覆盖路由

当你希望文件路径与实际 API 不一致时，可以用 `url` 覆盖：

```ts
export default {
  method: 'post',
  url: '/auth/login',
  response: { ok: true },
}
```
