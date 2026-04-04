# Upgrade to v1

This guide summarizes the breaking changes you need to check when upgrading to Mokup v1.

Related entries:

- [Installation](/getting-started/installation)
- [Vite Plugin](/reference/vite-plugin)

## 1. Node.js requirement

All published packages now require:

```text
^20.19.0 || >=22.12.0
```

Earlier Node.js versions are no longer supported.

## 2. Packages are now ESM-only

All published packages now ship ESM output only.

This CommonJS usage is no longer supported:

```js
const mokup = require('mokup')
```

Use ESM instead:

```ts
import mokup from 'mokup'
```

## 3. `@mokup/shared/esbuild` has been removed

Old entry:

```ts
import { build } from '@mokup/shared/esbuild'
```

must now be replaced with:

```ts
import { build } from '@mokup/shared/rolldown'
```

The repository now uses `@mokup/shared/rolldown` directly, backed by Rolldown.

## 4. Build tooling changed to `tsdown`

Published packages have been migrated from `unbuild` / `tsup` to `tsdown`.

If you extend package build configuration inside this monorepo, prefer:

- `tsdown.config.ts`
- `tsdown --watch`

instead of old `build.config.ts`, `tsup`, or `unbuild` setups.

## 5. Upgrade checklist

- Ensure CI, Docker, and deployment environments use a supported Node.js version
- Replace any CommonJS `require()` usage of published packages
- Replace any old `@mokup/shared/esbuild` imports
- Remove old package build scripts or `build.config.ts` files

## 6. Current repository status

This repository has already completed the migration:

- Published packages are ESM-only
- Published packages build with `tsdown`
- `tsdown` is pinned to `rolldown@1.0.0-rc.13`
- Unit tests, type tests, and serial e2e tests pass
