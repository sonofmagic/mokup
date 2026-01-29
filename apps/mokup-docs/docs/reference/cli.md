# CLI

`mokup` provides both `build` and `serve` commands.

## Build

Generate `.mokup` outputs for server adapters and workers.

Use cases:

- Generate a bundle for Worker or server runtime deployment.
- Prebuild mock artifacts for CI/CD without running a dev server.

Demo:

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
| `--include`       | Include regex (repeatable)                |
| `--exclude`       | Exclude regex (repeatable)                |
| `--ignore-prefix` | Ignore path segment prefixes (repeatable) |
| `--no-handlers`   | Skip handler output                       |

## Serve

Start a standalone mock server from a directory.

Use cases:

- Spin up a local mock API server without a frontend.
- Validate mock routes with curl or integration tests.

Demo:

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
| `--include`       | Include regex (repeatable)                |
| `--exclude`       | Exclude regex (repeatable)                |
| `--ignore-prefix` | Ignore path segment prefixes (repeatable) |
| `--host`          | Hostname (default: `localhost`)           |
| `--port`          | Port (default: `8080`)                    |
| `--no-watch`      | Disable file watching                     |
| `--no-playground` | Disable Playground                        |
| `--no-log`        | Disable logging                           |

## API

If you prefer programmatic usage, import `buildManifest`:

Use cases:

- Generate manifests inside Node scripts or build pipelines.
- Integrate Mokup with custom tooling or frameworks.

Demo:

```ts
import { buildManifest } from 'mokup/cli'

await buildManifest({
  dir: 'mock',
  outDir: '.mokup',
})
```

### Bundle helper (cross-platform)

Generate a bundle module source string without touching the filesystem:

Use cases:

- Build a bundle string in environments without filesystem access.
- Control how module import IDs are emitted for custom runtimes.

Demo:

```ts
import type { RouteTable } from 'mokup/bundle'
import { buildBundleModule } from 'mokup/bundle'

const routes: RouteTable = []
const source = buildBundleModule({
  routes,
  root: '/project',
  resolveModulePath: file => `/virtual/${file}`,
})
```

`routes` uses the same resolved route shape as `scanRoutes` (from `mokup/vite`). Use
`resolveModulePath` to control how module import ids are emitted outside of Vite.

## Notes

- Multiple `--dir` values are merged into one manifest.
- `mokup.bundle.mjs` is the recommended runtime entry.
- `mokup serve` mirrors the standalone server behavior.
