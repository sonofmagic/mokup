# Mock 规则

一个 mock 文件可以导出单条或多条规则。规则字段如下：

- `handler`: 响应内容或处理函数（必填）
- `status`: 状态码
- `headers`: 响应头
- `delay`: 延迟毫秒数

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
  handler: { ok: true },
}
```

数组导出仍使用文件路由生成路径，重复路由会提示告警。
