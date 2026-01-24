# CLI

`mokup` 提供 `build` 与 `serve` 两个命令。

## Build

生成供服务端适配器与 Worker 使用的 `.mokup` 构建产物。

::: code-group

```bash [pnpm]
pnpm exec mokup build --dir mock --out .mokup
```

```bash [npm]
npm exec mokup build --dir mock --out .mokup
```

```bash [yarn]
yarn mokup build --dir mock --out .mokup
```

```bash [bun]
bunx mokup build --dir mock --out .mokup
```

:::

### Build 选项

| 参数              | 说明                      |
| ----------------- | ------------------------- |
| `--dir, -d`       | mock 目录（可重复）       |
| `--out, -o`       | 输出目录（默认 `.mokup`） |
| `--prefix`        | 路由前缀                  |
| `--include`       | 仅包含匹配的正则          |
| `--exclude`       | 排除匹配的正则            |
| `--ignore-prefix` | 忽略路径段前缀（可重复）  |
| `--no-handlers`   | 不生成函数处理器          |

## Serve

从目录直接启动独立的 mock 服务。

::: code-group

```bash [pnpm]
pnpm exec mokup serve --dir mock --prefix /api --port 3000
```

```bash [npm]
npm exec mokup serve --dir mock --prefix /api --port 3000
```

```bash [yarn]
yarn mokup serve --dir mock --prefix /api --port 3000
```

```bash [bun]
bunx mokup serve --dir mock --prefix /api --port 3000
```

:::

### Serve 选项

| 参数              | 说明                       |
| ----------------- | -------------------------- |
| `--dir, -d`       | mock 目录（可重复）        |
| `--prefix`        | 路由前缀                   |
| `--include`       | 仅包含匹配的正则           |
| `--exclude`       | 排除匹配的正则             |
| `--ignore-prefix` | 忽略路径段前缀（可重复）   |
| `--host`          | 主机名（默认 `localhost`） |
| `--port`          | 端口（默认 `8080`）        |
| `--no-watch`      | 关闭文件监听               |
| `--no-playground` | 关闭 Playground            |
| `--no-log`        | 关闭日志输出               |

## API

如果更喜欢编程式用法，可直接调用 `buildManifest`：

```ts
import { buildManifest } from 'mokup/cli'

await buildManifest({
  dir: 'mock',
  outDir: '.mokup',
})
```

## 说明

- `--dir` 可多次传入，但会在同一份 manifest 中合并。
- 生成的 `mokup.bundle.mjs` 适合在 Worker 或 Node 运行时直接导入。
- `mokup serve` 与内置服务直启行为一致。
