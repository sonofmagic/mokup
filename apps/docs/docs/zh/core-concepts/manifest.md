# Manifest

CLI 构建会输出 `.mokup/mokup.manifest.json` 与 `.mokup/mokup.manifest.mjs`，用于描述所有路由与响应规则。

核心结构（简化）：

```json
{
  "version": 1,
  "routes": [
    {
      "method": "GET",
      "url": "/users",
      "tokens": [],
      "score": [],
      "source": "mock/users.get.json",
      "response": { "type": "json", "body": [] }
    }
  ]
}
```

当 `response.type` 为 `module` 时，表示该规则指向一个函数处理器：

```json
{
  "type": "module",
  "module": "./mokup-handlers/mock/users.get.mjs",
  "ruleIndex": 0
}
```

`mokup.bundle.mjs` 会把 manifest 与 handler module map 打包成一个可直接导入的对象，适用于 Worker 或其他运行时。
