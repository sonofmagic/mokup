# Manifest 结构

`mokup.manifest.json` 的核心字段：

使用场景：

- 在 CI 中校验或审阅生成的 manifest。
- 自定义工具或测试场景中生成 manifest。

示例：

```ts
const manifest: Manifest = {
  version: 1,
  routes: [
    {
      method: 'GET',
      url: '/api/ping',
      response: { type: 'text', body: 'ok' },
    },
  ],
}
```

```ts
interface Manifest {
  version: 1
  routes: ManifestRoute[]
}

interface ManifestRoute {
  method: string
  url: string
  tokens?: RouteToken[]
  score?: number[]
  source?: string
  status?: number
  headers?: Record<string, string>
  delay?: number
  middleware?: ManifestModuleRef[]
  response: ManifestResponse
}

interface ManifestModuleRef {
  module: string
  exportName?: string
  ruleIndex?: number
}
```

`ManifestResponse`：

```ts
type ManifestResponse
  = | { type: 'json', body: unknown }
    | { type: 'text', body: string }
    | { type: 'binary', body: string, encoding: 'base64' }
    | ({ type: 'module' } & ManifestModuleRef)
```

`ruleIndex` 用于从模块导出的规则或中间件数组中选择具体条目，`module` 可以是相对路径（CLI 输出）或 Vite 模块路径（SW 构建）。

通常你不需要手写 manifest，CLI 会自动生成。
