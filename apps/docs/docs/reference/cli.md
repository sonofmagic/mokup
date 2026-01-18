# CLI

`@mokup/cli` 提供 `mokup build` 命令，用于生成 `.mokup` 产物。

## 基本用法

```bash
pnpm exec mokup build --dir mock --out .mokup
```

## 参数

| 参数            | 说明                      |
| --------------- | ------------------------- |
| `--dir, -d`     | mock 目录（可重复）       |
| `--out, -o`     | 输出目录（默认 `.mokup`） |
| `--prefix`      | 路由前缀                  |
| `--include`     | 仅包含匹配的正则          |
| `--exclude`     | 排除匹配的正则            |
| `--no-handlers` | 不生成函数处理器          |

## 说明

- `--dir` 可多次传入，但会在同一份 manifest 中合并。
- 生成的 `mokup.bundle.mjs` 适合在 Worker 或 Node 运行时直接导入。
