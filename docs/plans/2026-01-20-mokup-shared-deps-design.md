# Mokup Shared Dependencies Design

## Goals

- Consolidate common runtime/build dependencies into a single internal package.
- Update all packages to import shared dependencies through `@mokup/shared` subpath exports.
- Reduce duplicated dependency management across packages while preserving behavior.

## Non-Goals

- No new runtime behavior or feature changes.
- No changes to how dependencies are bundled for consumers beyond moving import paths.

## Proposed Package

Create a new package: `packages/shared` with name `@mokup/shared`.

### Exports

Expose common dependencies via subpath exports:

- `@mokup/shared/esbuild`
- `@mokup/shared/chokidar`
- `@mokup/shared/hono`
- `@mokup/shared/pathe`
- `@mokup/shared/jsonc-parser`

Each entry re-exports the upstream module without wrapping:

```ts
export * from 'esbuild'
```

Add default export re-exports if any consumer relies on defaults (verify per dependency).

## Migration Plan

1. Add `packages/shared` with `package.json`, `build.config.ts`, `tsconfig.json` and entry files for each shared dependency.
2. Replace imports in `packages/mokup`, `packages/server`, and `packages/cli`:
   - `import { build } from 'esbuild'` -> `import { build } from '@mokup/shared/esbuild'`
   - `import { Hono } from 'hono'` -> `import { Hono } from '@mokup/shared/hono'`
   - `import { resolve } from 'pathe'` -> `import { resolve } from '@mokup/shared/pathe'`
   - `import { parse } from 'jsonc-parser'` -> `import { parse } from '@mokup/shared/jsonc-parser'`
   - `import chokidar from 'chokidar'` -> `import chokidar from '@mokup/shared/chokidar'` (ensure default export is preserved)
3. Remove duplicated dependencies from package `dependencies`, replacing with `@mokup/shared`.
4. Update lockfile after install.

## Risks

- If a dependency relies on a default export, the shared entry must also export `default` to match.
- Type re-exports must preserve upstream types to avoid TS regressions.

## Testing

- Run targeted tests for affected packages:
  - `pnpm --filter @mokup/server test`
  - `pnpm --filter @mokup/cli test`
- Optional: `pnpm lint` for import consistency.

## Open Questions

- None.
