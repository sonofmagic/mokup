# Playground before/after middleware visibility

## Summary

Add a Hono-native config API to register directory-level middlewares as `before` and `after`, then surface counts and lists for both in the playground route list and detail view. Preserve the existing `middleware` field as `before` for backwards compatibility.

## Goals

- Allow config authors to register directory middlewares using Hono-like `use()` calls.
- Track and serialize `before` vs `after` middleware lists for each route.
- Show both counts and full lists in the playground list/tree and detail panel.
- Preserve existing behavior for legacy `middleware` config entries.

## Non-goals

- Introduce route-level middleware beyond existing directory config.
- Change execution semantics of Hono middleware.
- Replace existing config file format outright.

## Options Considered

- **defineConfig with before/after registries (recommended)**: Hono-like `use()` API without relying on Hono internals.
- **New config fields (afterMiddleware)**: easy but not Hono-native.
- **Accept Hono instances directly**: most native but relies on internal structures.

## Recommended Approach

Introduce `defineConfig` in `mokup`, `mokup/vite`, `@mokup/server`, and `@mokup/cli` exports. The helper creates two registries, `before` and `after`, each with a `use(...handlers)` method. It collects the handlers and returns a standard `RouteDirectoryConfig` with extra metadata that the scanners can read. Legacy `middleware` entries map to `before` when present.

Example:

```ts
import { defineConfig } from 'mokup'

export default defineConfig(({ before, after }) => {
  before.use(auth, metrics)
  after.use(timing)

  return {
    headers: { 'x-mokup-scope': 'docs' },
    delay: 120,
  }
})
```

## Data Model Changes

- Extend `ResolvedMiddleware` to include `position: 'before' | 'after'`.
- Extend playground route payload with:
  - `beforeMiddlewareCount`, `afterMiddlewareCount`
  - `beforeMiddlewares`, `afterMiddlewares`
- Keep `middlewareCount`/`middlewares` for compatibility if needed; otherwise deprecate in UI.

## Execution Semantics

- Registration order is preserved within each list.
- When building Hono routes, middleware order remains:
  - `finalize -> before... -> after... -> handler`
- Post-phase order follows Hono behavior (reverse registration), matching current middleware semantics.

## Playground UI

- **List/Tree**: Show both counts (example: `B:2 A:1`) alongside the route badge.
- **Detail Panel**: Add a Middlewares block with two sections (Before/After) listing sources in registration order.

## Error Handling

- Non-function middleware entries are ignored with a warning referencing the config file path.
- If both legacy `middleware` and new `before/after` are used, merge legacy into `before` after the explicit `before` list.

## Testing

- Unit tests for `defineConfig` registry collection and invalid handler logging.
- Config resolution tests for before/after merge order and position tagging.
- Playground serialization tests for before/after counts and formatted lists.
- UI tests (if present) for list badges and detail sections.

## Rollout

- Keep legacy `middleware` as supported and documented.
- Document `defineConfig` as the preferred pattern.
