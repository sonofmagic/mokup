# Index Config Hook API Design

## Summary

Replace the current `defineConfig(({ pre, normal, post }) => ...)` middleware registry with a more ergonomic API that uses lifecycle-style hooks and a single `app` instance. Provide `onBeforeAll`/`onAfterAll` hooks to map to existing `pre`/`post` stages while keeping `app.use` as `normal`.

## Goals

- Provide a clean, readable API in `index.config.ts` without exposing `pre/normal/post`.
- Support async registration logic (hooks may await work before registering middlewares).
- Preserve current execution semantics by mapping to `pre/normal/post` internally.
- Allow per-config error policy for hook failures.

## Non-Goals

- Backward compatibility with `defineConfig(({ pre, normal, post }) => ...)`.
- Introducing additional runtime stages beyond pre/normal/post.

## Proposed API

```ts
import { defineConfig, onAfterAll, onBeforeAll } from 'mokup'

export default defineConfig(async ({ app }) => {
  onBeforeAll(async () => {
    app.use(async (c, next) => {
      await next()
    })
  })

  app.use(async (c, next) => {
    await next()
  })

  onAfterAll(() => {
    app.use(async (c, next) => {
      await next()
    })
  })

  return {
    headers: { 'x-mokup-scope': 'docs' },
    delay: 120,
    hookError: 'warn',
  }
})
```

### Semantics Mapping

- `onBeforeAll` → `pre` middlewares
- `app.use` → `normal` middlewares
- `onAfterAll` → `post` middlewares

### Directory Merge Order

- `pre`: root → leaf
- `normal`: root → leaf
- `post`: leaf → root

## Execution Model

- `defineConfig` establishes a scoped execution context for hooks.
- `onBeforeAll` and `onAfterAll` may only be called inside `defineConfig` callback; otherwise they throw.
- `defineConfig` may be `async`; the loader must `await` the default export when it is a Promise.
- Hooks are queued and executed after the callback completes. During hook execution, `app.use` temporarily writes to the corresponding stage list.

## Error Handling

Add a config option (tentative name `hookError`) to control hook failures:

- `'throw'` — throw and fail immediately
- `'warn'` (default) — log warning and continue
- `'silent'` — ignore

Applies only to hook execution errors (not to config load errors or invalid middleware types).

## Compatibility

- No support for the old `defineConfig(({ pre, normal, post }) => ...)` signature.
- Hooks must come from the same package entry as `defineConfig` (e.g., `mokup`, `@mokup/cli`).

## Implementation Notes

- Update `defineConfig` in `mokup`, `@mokup/cli`, and `@mokup/server` to the new API.
- Add hook context storage (module-level stack or async local) to validate hook usage.
- Update config loaders to await async `defineConfig` exports.
- Keep existing middleware metadata symbol and downstream normalization unchanged.

## Tests

- `defineConfig` with `app.use` only → normal list.
- `onBeforeAll` and `onAfterAll` mapping and order.
- Async hook registration.
- Hook invocation outside `defineConfig` throws.
- Error policy (`hookError`) behaviors.

## Docs

- Update `index.config.ts` examples to use `defineConfig(({ app }) => ...)` plus hooks.
- Explain stage mapping and merge order in advanced docs.
