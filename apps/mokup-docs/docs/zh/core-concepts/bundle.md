# Bundle

`mokupBundle` 是用于运行时执行的打包对象，通常来自 CLI 产物
`.mokup/mokup.bundle.mjs`，或在 Vite 中通过虚拟模块
`virtual:mokup-bundle` 获取。

## 为什么需要 mokupBundle？

在开发环境中，Mokup 可以直接读取文件并执行处理器，但多数生产运行时无法
访问本地文件系统。Worker 与 Serverless 更倾向于单一入口模块。
`mokupBundle` 把 manifest 与处理器模块引用打包在一起，使这些环境也能执行
相同的路由逻辑。

## 包含哪些内容？

Bundle 有三个字段：

- `manifest`：路由定义、响应与元数据。
- `moduleMap`：处理器模块 id 到模块导出的映射。
- `moduleBase`：处理器模块解析所需的基准路径。

其中只有 `manifest` 是必需的。`moduleMap` 与 `moduleBase` 用于 Worker /
Serverless 等无法直接加载本地文件的环境。

## manifest

manifest 是路由匹配的核心数据，每条路由包含 HTTP 方法、URL 模板、tokens
以及响应定义（`json`、`text`、`binary` 或 `module`）。

结构细节请参考 [Manifest](./manifest)。

## moduleMap

当响应类型为 `type: "module"` 时，需要用 `moduleMap` 解析处理器模块。它把
模块 id 映射到模块导出对象，避免运行时直接访问文件系统。

常见来源包括：

- `.mokup/mokup.bundle.mjs`（CLI 构建输出）
- `virtual:mokup-bundle`（Vite 的 Worker 运行模式）

## moduleBase

`moduleBase` 用于拼接处理器模块路径。CLI bundle 中默认是 `./`，因为
handler 模块输出在 `.mokup/mokup-handlers` 下。

如果你自己生成 bundle，请确保 `moduleBase` 与实际部署路径一致。

## Bundle 生成方式

常见方式有三种：

- CLI：`mokup build` 生成 `.mokup/mokup.bundle.mjs`。
- Vite：`mokup/vite` 下直接 `import 'virtual:mokup-bundle'`。
- 跨平台：`mokup/bundle` 的 `buildBundleModule` 直接生成模块源码。

## 何时可以省略 moduleMap 或 moduleBase？

如果所有路由都是静态响应（如 JSON / 文本），可以只传 `manifest`。

在 Node 环境中，只要运行时能直接导入处理器文件，也可以省略
`moduleMap` 与 `moduleBase`。

## 常见问题

- Worker 环境缺少 `moduleMap` 会导致模块处理器无法执行。
- `moduleBase` 配置错误会导致处理器模块无法解析。

## 最小使用示例

推荐写法：

```ts
import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from './.mokup/mokup.bundle.mjs'

const handler = createFetchHandler(mokupBundle)
```

也可以显式传入字段：

```ts
import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from './.mokup/mokup.bundle.mjs'

const handler = createFetchHandler({
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: mokupBundle.moduleBase,
})
```
