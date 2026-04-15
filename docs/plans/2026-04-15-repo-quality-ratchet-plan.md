# 2026-04-15 Repository Quality Ratchet Plan

## Goals

- Keep developer feedback fast (`typecheck:fast`, non-blocking line-budget report).
- Expose a single fast local gate via `pnpm run validate:fast`.
- Ratchet repository quality without blocking unrelated delivery.
- Convert current hotspots into incremental, reviewable tasks.

## Track A: Line Budget (300 non-comment lines)

Current mode:

- CI runs `pnpm run lint:lines:guard` (`>300` warn, `>500` fail).
- Local fail-fast remains available via `pnpm run lint:lines`.
- Local fast-path now lives at `pnpm run validate:fast`.

Phase 1 (short-term):

- New/rewritten files must stay under budget.
- Touching files above budget requires either:
  - extracting one helper/module/component, or
  - adding a TODO issue link in PR description.

Phase 2 (ratchet):

- Reduce hard-fail gate from `500` to `400` lines once current top offenders are split.
- Keep warn mode for `301-400` lines.

Phase 3 (strict):

- Switch CI to `lint:lines` fail-fast once the current hotspot list is cleared.

Hotspots from latest report:

- None. `pnpm run lint:lines:guard` is currently clean.

Next ratchet candidate:

- Switch CI from guard mode to strict `pnpm run lint:lines` after one more maintenance cycle without regressions.

## Track B: Coverage Hotspots

Global thresholds are now enabled in Vitest. Next focus is low-value gaps that hide regressions:

- `packages/mokup/src/webpack/plugin.ts`
- `packages/playground/src/utils/search.ts`
- `packages/shared/src/diagnostics.ts`
- `packages/client/src/utils.ts`

Execution rule:

- When changing one hotspot file, add at least one regression test around changed behavior.
- Prefer behavior tests over snapshot-only assertions.

## Suggested Issue Breakdown

1. Switch CI line budget from `guard` to strict mode after the next stable pass.
2. Add webpack plugin branch tests for unsupported/edge config paths.
3. Add diagnostics formatting tests for warning/error grouping.
4. Add playground search tests for fuzzy/empty/large-tree scenarios.
5. Add regression tests for extracted playground shell/workspace helpers.
