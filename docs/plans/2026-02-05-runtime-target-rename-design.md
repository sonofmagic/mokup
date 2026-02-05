# Runtime Target Rename Design

## Summary

Rename the Vite plugin runtime option to a more general "runtime target" that is not tied to Vite, using `'node' | 'worker'` as values. Keep `ViteRuntime` as a deprecated alias for compatibility, but remove support for the `'vite'` runtime value and throw an error if it is used.

## Goals

- Replace the Vite-bound runtime name with a general runtime target name.
- Use `'node' | 'worker'` as the supported runtime values.
- Keep existing type imports working via a deprecated alias.
- Fail fast when legacy `'vite'` is provided.
- Update documentation to reflect the new naming and default.

## Non-Goals

- Backward compatibility for `'vite'` runtime value at runtime.
- Changing the existing middleware behavior or execution model.
- Renaming public package entry points.

## Proposed API

```ts
import type { RuntimeTarget } from 'mokup/vite'

export interface MokupPluginOptions {
  entries?: VitePluginOptions | VitePluginOptions[]
  playground?: PlaygroundOptionsInput
  runtime?: RuntimeTarget
}

export type RuntimeTarget = 'node' | 'worker'

/** @deprecated Use RuntimeTarget instead. */
export type ViteRuntime = RuntimeTarget
```

## Execution Model

- `runtime` defaults to `'node'`.
- `runtime: 'worker'` disables Vite dev middleware and uses the worker runtime.
- `runtime: 'vite'` throws an error during option normalization.

## Error Handling

- If `runtime === 'vite'`, throw an error with an explicit migration message.
- No fallback or warning behavior for legacy values.

## Compatibility

- `ViteRuntime` remains available as a deprecated alias.
- Any runtime config using `'vite'` will now fail fast.

## Implementation Notes

- Add `RuntimeTarget` to shared types and re-export from `mokup/vite`.
- Update `MokupPluginOptions.runtime` to use `RuntimeTarget`.
- Update JSDoc defaults to `"node"` and adjust examples.
- Add runtime validation in `normalizeMokupOptions`.
- Update docs in both English and Chinese Vite plugin references.

## Tests

- Typecheck `mokup-web-demo` to ensure the plugin options remain valid.
- Verify `'vite'` runtime throws by unit coverage or manual check.

## Docs

- Update `apps/mokup-docs/docs/reference/vite-plugin.md`.
- Update `apps/mokup-docs/docs/zh/reference/vite-plugin.md`.
