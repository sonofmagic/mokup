# Bundle Export (Cross-Platform)

## Summary

Expose a cross-platform bundle generator from `mokup/bundle` that returns a
bundle module source string without touching the filesystem. Document how to
use it alongside the existing CLI build flow.

## Goals

- Provide a stable, non-Node export path for bundle generation.
- Keep the API small and compatible with existing route data.
- Document usage in the reference docs.

## Non-Goals

- Adding new CLI commands or flags.
- Writing bundle files directly from this API.
- Changing route scanning behavior.

## Approach

- Add `packages/mokup/src/bundle.ts` that re-exports `buildBundleModule` and
  types from `./shared/types`.
- Add a new export path `mokup/bundle` in `packages/mokup/package.json`.
- Ensure the build config includes `src/bundle` so type stubs are generated.
- Update docs (`reference/cli` in EN/ZH) with a cross-platform bundle helper
  section and usage notes.

## API Shape

```ts
import type { RouteTable } from 'mokup/bundle'
import { buildBundleModule } from 'mokup/bundle'

const source = buildBundleModule({
  routes: [] as RouteTable,
  root: '/project',
  resolveModulePath: file => `/virtual/${file}`,
})
```

## Testing

- No new tests. Existing `buildBundleModule` unit tests remain valid.
