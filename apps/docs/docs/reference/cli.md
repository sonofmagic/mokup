# CLI

`mokup` provides both `build` and `serve` commands.

## Build

Generate `.mokup` outputs for server adapters and workers.

```bash
pnpm exec mokup build --dir mock --out .mokup
```

### Build options

| Option          | Description                          |
| --------------- | ------------------------------------ |
| `--dir, -d`     | Mock directory (repeatable)          |
| `--out, -o`     | Output directory (default: `.mokup`) |
| `--prefix`      | URL prefix                           |
| `--include`     | Include regex                        |
| `--exclude`     | Exclude regex                        |
| `--no-handlers` | Skip handler output                  |

## Serve

Start a standalone Node.js mock server from a directory.

```bash
pnpm exec mokup serve --dir mock --prefix /api --port 3000
```

### Serve options

| Option            | Description                     |
| ----------------- | ------------------------------- |
| `--dir, -d`       | Mock directory (repeatable)     |
| `--prefix`        | URL prefix                      |
| `--include`       | Include regex                   |
| `--exclude`       | Exclude regex                   |
| `--host`          | Hostname (default: `localhost`) |
| `--port`          | Port (default: `8080`)          |
| `--no-watch`      | Disable file watching           |
| `--no-playground` | Disable Playground              |
| `--no-log`        | Disable logging                 |

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
- `mokup serve` mirrors the Node.js dev server behavior.
