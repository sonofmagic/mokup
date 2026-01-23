# Fetch server dev API design

## Goal

Provide a cross-runtime dev API that runs mocks from `dir` and exposes a fetch handler for Node, Deno, and Bun:

```ts
import { createFetchServer } from 'mokup/server'

const app = await createFetchServer({ dir: 'mock' })
const response = await app.fetch(new Request('http://localhost/api/users'))
```

The API mirrors the dev server options while remaining runtime-neutral.

## Scope

- Add `createFetchServer` to `mokup/server`.
- Accept a single options object or an array of options objects.
- Support Vite-like dev options: `dir`, `prefix`, `include`, `exclude`, `watch`, `log`, `playground`.
- Support server options: `host`, `port`, `root` (used for logs/links only).

Out of scope:

- Service Worker mode.
- Build-mode bundling (still via existing runtime/server APIs).

## API shape

```ts
export async function createFetchServer(
  options?: FetchServerOptions | FetchServerOptions[],
): Promise<FetchServer>

export interface FetchServer {
  fetch: (request: Request) => Promise<Response>
  refresh: () => Promise<void>
  getRoutes: () => RouteTable
  close?: () => Promise<void>
}
```

Behavior:

- `createFetchServer` performs an initial scan before resolving.
- `refresh()` rescans directories and rebuilds the internal Hono app.
- `fetch()` always uses the latest app instance.

## Implementation plan

### Core wiring

- Reuse dev scanner, route builder, and playground logic under `packages/server/src/dev/*`.
- Build a Hono app from scanned routes and mount playground routes when enabled.
- Expose `fetch` by delegating to the latest Hono app.

### Option merging

- Normalize options to an array.
- `dir` resolved per entry relative to `root`.
- `prefix`, `include`, `exclude` applied per entry during scan.
- `watch` and `log` enabled only if all entries opt in.
- `playground` resolved from the first entry that defines it, otherwise default to enabled at `/__mokup`.
- `host`, `port`, `root` use the first provided value or fall back to defaults.

### Watch support

- Node/Bun: use `chokidar` for file watching.
- Deno: use `Deno.watchFs` when available.
- If no watcher API is available, disable watch and proceed without throwing.
- `close()` stops the watcher when present.

## Error handling

- Scan failures log errors and keep the last successful routes.
- Fetch errors return `500` and log the error.
- Duplicate routes warn and continue.

## Tests

- Node-only unit tests:
  - `createFetchServer` responds to JSON mocks.
  - `refresh()` rebuilds routes.
  - `playground: false` disables playground routes.

## Rollout notes

- Update docs to show `createFetchServer` for Deno/Bun usage.
- Remove the Node-only `listen()` convenience in favor of `createFetchServer`.
