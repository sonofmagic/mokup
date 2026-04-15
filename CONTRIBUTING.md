# Contributing

## Baseline

- Use Node.js `^20.19.0 || >=22.12.0`
- Use `pnpm`
- Keep published packages ESM-only
- Keep published library packages on `tsdown` + `rolldown`

## Before Opening A PR

- Run `pnpm run guard:migration`
- Run `pnpm run typecheck:fast` while iterating (optional, faster local feedback)
- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm run lint:lines` for line-budget checks (or `pnpm run lint:lines:warn` for report-only mode)
- Run `pnpm test`
- Run `pnpm test:e2e:serial` for changes that may affect demos, dev server flow, HMR, or root Playwright E2E coverage

## Line Budget Guard

`scripts/lint-lines.mjs` checks non-comment source lines in `packages/*/src` and currently uses a `300`-line budget per file.

- `pnpm run lint:lines` runs in fail-fast mode (`--mode=error`)
- `pnpm run lint:lines:warn` reports oversized files without failing

CI currently uses warn mode to keep existing hotspots visible while avoiding blocking unrelated PRs. For new or heavily touched files, prefer extracting reusable helpers/components to keep files under the budget.

## Migration Guards

The repository enforces the post-migration constraints in `scripts/check-migration-guards.mjs`.

The guard blocks:

- Reintroducing `@mokup/shared/esbuild`
- Direct `esbuild` imports in repository code or config
- Reintroducing `tsup`, `unbuild`, or `build.config.*` in active code/config
- Published library packages drifting away from:
  - `type: "module"`
  - `engines.node: "^20.19.0 || >=22.12.0"`
  - `build: "tsdown"`
  - `dev: "tsdown --watch"`
  - ESM-only `exports`

If you intentionally change these rules, update the guard script, its tests, and the migration docs in the same PR.
