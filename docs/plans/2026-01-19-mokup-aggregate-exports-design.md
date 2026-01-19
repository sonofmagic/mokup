# Mokup Aggregate Exports Design

## Goal

Let users install only `mokup` while still accessing CLI and server adapters via
`mokup/cli`, `mokup/server`, and `mokup/server/worker`. Keep `@mokup/cli` and
`@mokup/server` published for compatibility.

## Non-Goals

- Remove or deprecate `@mokup/cli` or `@mokup/server`.
- Add a `mokup` binary; CLI remains API-only from `mokup/cli`.
- Change internal package dependencies away from `@mokup/runtime`.

## Architecture

`mokup` becomes the single default install by exposing thin subpath re-exports
that forward to `@mokup/cli` and `@mokup/server`. The underlying packages stay
intact and continue to publish independently. `mokup` adds new entries and
exports to map `mokup/cli`, `mokup/server`, and `mokup/server/worker` to its
generated dist files. Documentation switches from CLI commands to API usage and
updates server adapter imports to the new subpaths.

## Components and API

- `packages/mokup/src/cli.ts`: `export * from '@mokup/cli'`.
- `packages/mokup/src/server.ts`: `export * from '@mokup/server'`.
- `packages/mokup/src/server/worker.ts`: `export * from '@mokup/server/worker'`.
- `packages/mokup/build.config.ts`: add `src/cli`, `src/server`,
  `src/server/worker` to `entries`.
- `packages/mokup/package.json`: add exports for `./cli`, `./server`,
  `./server/worker` with `types/import/require`.
- `packages/mokup/package.json`: add dependencies on `@mokup/cli` and
  `@mokup/server`.
- Docs: change CLI usage to `mokup/cli` API samples; update adapter imports to
  `mokup/server` and `mokup/server/worker`.

## Data Flow

1. User installs `mokup`.
2. Imports resolve to `mokup/dist/{cli,server,server/worker}.*`.
3. These re-export `@mokup/cli` and `@mokup/server` APIs unchanged.
4. Runtime and adapter behavior remain the same because the underlying packages
   are unchanged.

## Error Handling

- Missing `mokup` yields a standard module resolution error.
- `@mokup/cli` and `@mokup/server` remain available for users who want direct
  installs.
- Avoid adding CLI bin to `mokup` to prevent conflicting command resolution.

## Testing

- Add or update tests (if needed) to ensure `mokup/cli` and `mokup/server`
  subpaths resolve in build outputs.
- Verify docs build if samples or scripts are updated:
  `pnpm --filter docs build:docs`.

## Rollout

- Ship new subpath exports in `mokup` with a changeset.
- Update docs and examples to default to `mokup/*` imports.
