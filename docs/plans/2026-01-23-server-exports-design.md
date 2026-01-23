# @mokup/server export redesign (runtime-safe entrypoints)

Date: 2026-01-23

## Goals

- Make the default entry (`@mokup/server`) runtime-agnostic for serverless/Deno/Bun.
- Avoid pulling Node built-ins or Node-only deps into the default module graph.
- Provide both aggregated Node exports and fine-grained adapter entrypoints.
- Allow breaking changes to the default entry surface.

## Non-goals

- No behavior changes to existing adapters.
- No new runtime features or config options.

## Proposed export surface

### Default entry (runtime-agnostic)

`@mokup/server` exports only:

- `createFetchHandler` (from `src/fetch.ts`)
- `createMokupWorker` (from `src/worker.ts`, non-Node)
- Types from `src/types.ts`
- Type re-exports from `@mokup/runtime`

### Node aggregate entry

`@mokup/server/node` re-exports:

- `connect`, `express`, `koa`, `fastify`
- `createFetchServer` (dev server)
- `createMokupWorker` from `src/worker-node.ts`
- `serve` from `@hono/node-server`

### Individual entrypoints

`@mokup/server/<name>` for:

- `connect`, `express`, `koa`, `fastify`
- `fetch`, `worker`, `worker-node`
- `fetch-server`, `hono`
- `node` (aggregate)

## Types

- Change `WorkerInput` to exclude `string` in `src/types.ts`.
- Introduce `NodeWorkerInput = string | Manifest | WorkerBundle` in Node-only entry.
- Default entry uses `WorkerInput`; Node entry uses `NodeWorkerInput`.

## Build & package changes

- Add entries for each module in `build.config.ts`.
- Extend `package.json` `exports` map for all subpaths.
- Keep `main/module/types` pointing at `dist/index.*` (minimal entry).

## Error handling

- Keep existing runtime guards (Node-only APIs still throw outside Node).
- Reduce non-Node errors by moving Node-only APIs behind Node entrypoints.

## Testing

- Add/adjust tests to validate default entry exports and types.
- Optional: assert `dist/index.mjs` contains no `node:` imports.
- Run `pnpm -C packages/server build` and `pnpm -C packages/server test`.

## Migration notes

- Replace `@mokup/server` imports with `@mokup/server/node` or specific adapters as needed.
- Update README examples to use new entrypoints.
