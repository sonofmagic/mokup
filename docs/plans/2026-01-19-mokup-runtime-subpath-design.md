# Mokup Runtime Subpath Export Design

## Goal

Make `mokup` the default install for most users while keeping `@mokup/runtime`
published. The public runtime entry should move to `mokup/runtime`, and the Vite
plugin SW output should import from that subpath so builds pass when only
`mokup` is installed.

## Non-Goals

- Deprecate or remove `@mokup/runtime`.
- Change internal package dependencies (`@mokup/server`, `@mokup/cli`) away from
  `@mokup/runtime`.
- Expand the root `mokup` export surface.

## Architecture

Expose runtime as a subpath export of `mokup` by adding a thin re-export entry.
Continue publishing `@mokup/runtime` for runtime-only consumers and for
internal packages that already depend on it. Update the Vite plugin SW generator
to import `createRuntime` from `mokup/runtime`. Documentation should default to
`mokup/runtime` usage and remove installation instructions that require
`@mokup/runtime`.

## Components and API

- `packages/mokup/src/runtime.ts`: `export * from '@mokup/runtime'`.
- `packages/mokup/build.config.ts`: add `src/runtime` to `entries` so unbuild
  generates `dist/runtime.*`.
- `packages/mokup/package.json`: add `exports["./runtime"]` with `types`,
  `import`, and `require` pointing to `dist/runtime.*`.
- `packages/mokup/src/vite/sw.ts`: emit `import { createRuntime } from
'mokup/runtime'` in the SW virtual module.
- Docs: replace `@mokup/runtime` references in getting-started/runtime docs with
  `mokup/runtime`, and update install snippets to only require `mokup` unless a
  server adapter is needed.

## Data Flow

1. User installs `mokup`.
2. Vite plugin generates SW code that imports `createRuntime` from
   `mokup/runtime`.
3. At build time, the subpath resolves to `mokup/dist/runtime.*` which re-exports
   `@mokup/runtime`.
4. Runtime behavior remains unchanged because all APIs originate from
   `@mokup/runtime`.

## Error Handling

- If users import `mokup/runtime` without `mokup` installed, they receive the
  standard module resolution error (same behavior as any missing package).
- If users want runtime-only, they can still install and import
  `@mokup/runtime`.
- Keep SW code simple; no dynamic fallback to `@mokup/runtime` to avoid larger
  bundles and confusing errors.

## Testing

- Unit: update or add a SW-related test to assert the generated virtual module
  uses `mokup/runtime`.
- Build: run `pnpm --filter docs build:docs` to confirm VitePress build resolves
  the runtime import with only `mokup` installed.

## Rollout

- Ship changes in `mokup` and update docs.
- Announce `mokup/runtime` as the recommended runtime import while keeping
  `@mokup/runtime` published for compatibility.
