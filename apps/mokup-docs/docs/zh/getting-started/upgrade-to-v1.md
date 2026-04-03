# 升级到 v1

本文档汇总了升级到 Mokup v1 时需要优先检查的 breaking change。

相关入口：

- [安装](/zh/getting-started/installation)
- [Vite 插件](/zh/reference/vite-plugin)

## 1. Node.js 版本要求

所有已发布包现在都要求：

```text
^20.19.0 || >=22.12.0
```

低于这个范围的 Node.js 版本不再支持。

## 2. 包输出改为 ESM-only

所有已发布包现在只提供 ESM 输出。

下面这类 CommonJS 用法不再受支持：

```js
const mokup = require('mokup')
```

需要改为 ESM：

```ts
import mokup from 'mokup'
```

## 3. `@mokup/shared/esbuild` 已改名

原来的内部兼容入口：

```ts
import { build } from '@mokup/shared/esbuild'
```

现在应改为：

```ts
import { build } from '@mokup/shared/rolldown'
```

这个 API 仍然保留给仓库内部使用，但底层实现已经切到 Rolldown。

## 4. 构建工具链改为 `tsdown`

已发布包的构建链已经从 `unbuild` / `tsup` 切换为 `tsdown`。

如果你在这个 monorepo 里扩展包构建配置，应优先使用：

- `tsdown.config.ts`
- `tsdown --watch`

而不是旧的 `build.config.ts`、`tsup` 或 `unbuild` 配置。

## 5. 升级检查清单

- 确认 CI、Docker、部署环境里的 Node.js 版本已升级
- 替换所有公开包的 CommonJS `require()` 用法
- 替换所有 `@mokup/shared/esbuild` 导入
- 清理旧的包构建脚本或 `build.config.ts`

## 6. 仓库当前状态

当前仓库已经完成以下迁移：

- 发布包统一为 ESM-only
- 发布包统一使用 `tsdown`
- `tsdown` 实际构建固定到 `rolldown@1.0.0-rc.13`
- 单元测试、类型测试、串行 e2e 测试已通过
