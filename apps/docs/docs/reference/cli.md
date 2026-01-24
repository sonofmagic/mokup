# CLI

`mokup` provides both `build` and `serve` commands.

## Build

Generate `.mokup` outputs for server adapters and workers.

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

### Build options

| Option            | Description                               |
| ----------------- | ----------------------------------------- |
| `--dir, -d`       | Mock directory (repeatable)               |
| `--out, -o`       | Output directory (default: `.mokup`)      |
| `--prefix`        | URL prefix                                |
| `--include`       | Include regex                             |
| `--exclude`       | Exclude regex                             |
| `--ignore-prefix` | Ignore path segment prefixes (repeatable) |
| `--no-handlers`   | Skip handler output                       |

## Serve

Start a standalone mock server from a directory.

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

### Serve options

| Option            | Description                               |
| ----------------- | ----------------------------------------- |
| `--dir, -d`       | Mock directory (repeatable)               |
| `--prefix`        | URL prefix                                |
| `--include`       | Include regex                             |
| `--exclude`       | Exclude regex                             |
| `--ignore-prefix` | Ignore path segment prefixes (repeatable) |
| `--host`          | Hostname (default: `localhost`)           |
| `--port`          | Port (default: `8080`)                    |
| `--no-watch`      | Disable file watching                     |
| `--no-playground` | Disable Playground                        |
| `--no-log`        | Disable logging                           |

## API

If you prefer programmatic usage, import `buildManifest`:

```ts
import { buildManifest } from 'mokup/cli'

await buildManifest({
  dir: 'mock',
  outDir: '.mokup',
})
```

## Notes

- Multiple `--dir` values are merged into one manifest.
- `mokup.bundle.mjs` is the recommended runtime entry.
- `mokup serve` mirrors the standalone server behavior.
