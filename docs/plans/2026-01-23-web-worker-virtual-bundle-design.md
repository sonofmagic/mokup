# web worker virtual mokup bundle (vite integration)

Date: 2026-01-23

## Goals

- Run `apps/web` in dev and build without generating `.mokup/mokup.bundle.mjs`.
- Keep worker entry code stable across dev and deploy.
- Use Vite (`@cloudflare/vite-plugin`) as the only build/runtime pipeline for Workers.
- Remove the `pnpm build:manifest` requirement from web workflows.

## Non-goals

- Support `wrangler dev` without Vite (it cannot resolve Vite virtual modules).
- Change mokup runtime behavior or route matching semantics.
- Replace the existing SW generation flow.

## Constraints

- Worker entry must remain a normal module (no dynamic FS access at runtime).
- Bundle must be buildable by Vite/Rollup for Cloudflare.
- Dev must update automatically when mock files change.

## Approaches

- A (chosen): add a Vite virtual module (`virtual:mokup-bundle`) that compiles
  `manifest` + `moduleMap` directly from route scanning.
- B: auto-write `.mokup/mokup.bundle.mjs` during Vite build (still creates files).
- C: runtime loader that scans filesystem (not supported in Workers).

## Proposed design

### New virtual bundle module

- Add a new virtual id in `packages/mokup/src/vite/plugin.ts`:
  `virtual:mokup-bundle` -> `\0virtual:mokup-bundle`.
- `load` calls `refreshRoutes()` and returns a generated ESM string:
  - static `import * as moduleN` for every handler/middleware file
  - `const manifest = { ... }`
  - `const moduleMap = { "<module-id>": moduleN, ... }`
  - `export default { manifest, moduleMap }`
- Use `this.addWatchFile()` for each route/middleware file so edits trigger
  virtual module invalidation in dev.

### Shared manifest generation

- Extract shared helpers from `vite/sw.ts` so both SW and bundle generation
  reuse the same route-to-manifest transform.
- Keep handler rule semantics identical to the current bundle output.

### Path resolution rules

- Dev: use Vite-resolvable module ids (same strategy as SW, e.g. `/@fs/...`).
- Build: use stable, bundler-friendly ids (root-relative or resolved paths).
- This is injected into the bundle generator via a `resolveModulePath` hook.

### Worker entry change

- Update `apps/web/worker/src/index.ts` to:
  `import mokupBundle from 'virtual:mokup-bundle'`.
- Keep `export default createMokupWorker(mokupBundle)` unchanged.

### Build/deploy flow

- Replace `worker:dev` with `vite dev` (Cloudflare plugin handles runtime).
- Replace `worker:deploy` with `vite build` + `wrangler deploy` on the Vite output.
- Remove `build:manifest` from the workflow; no `.mokup` directory is produced.
- Update Cloudflare docs to reference the virtual bundle import path.

## Data flow

1. Vite resolves `virtual:mokup-bundle`.
2. mokup plugin scans routes -> `RouteTable`.
3. Bundle generator emits ESM with static imports + `manifest` + `moduleMap`.
4. Cloudflare plugin bundles the worker output for dev/build.
5. Runtime calls `createMokupWorker(mokupBundle)` with in-memory bundle.

## Error handling

- Route scan or codegen failures surface during Vite `load()` as build errors.
- Runtime errors remain unchanged (no filesystem dependency).

## Testing

- Unit: bundle generator outputs `manifest` + `moduleMap` with expected ids.
- E2E: `vite dev` (worker) should serve mock routes without any `.mokup` files.
- Build: `vite build` + deploy output should function in Cloudflare runtime.

## Migration notes

- Replace `./.mokup/mokup.bundle.mjs` imports with `virtual:mokup-bundle`.
- Remove any `pnpm build:manifest` usage in web scripts.
- Keep `wrangler.jsonc` aligned with Vite output entry.

## Implementation steps

1. Add bundle generator helper in `packages/mokup/src/vite`.
2. Wire `virtual:mokup-bundle` into `createMokupPlugin`.
3. Update `apps/web/worker/src/index.ts` import.
4. Update `apps/web` scripts and Cloudflare docs.
5. Add/adjust tests for bundle output and dev/build flows.
