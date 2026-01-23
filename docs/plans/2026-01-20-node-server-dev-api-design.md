# Node server dev API design

## Goal

Provide a simple dev-mode API that runs mocks from `dir` with hot reload and a Node-friendly fetch adapter:

```ts
import { serve } from '@hono/node-server'
import { createFetchServer } from 'mokup/server'

const app = await createFetchServer({ dir: 'mock' })
serve({ fetch: app.fetch, port: 3000 })
```

The API should mirror the Vite plugin options where reasonable and always run in mock server mode (no SW).

## Scope

- Add `createFetchServer` to `mokup/server`.
- Accept a single options object or an array of options objects.
- Support Vite-like dev options: `dir`, `prefix`, `include`, `exclude`, `watch`, `log`, `playground`.
- Support server options: `host`, `port`, `root`.

Out of scope:

- Service Worker mode.
- Build-mode bundling (still available via existing runtime/server APIs).

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

- `createFetchServer` performs the initial scan before resolving.
- `fetch()` always uses the latest app instance.

## Implementation plan

### Core wiring

- Reuse the existing dev scanner, route builder, and playground logic under `packages/server/src/dev/*`.
- Build the Hono app from scanned routes and mount playground routes if enabled.
- Create the Node server using `@hono/node-server` `createAdaptorServer({ fetch: request => app.fetch(request) })`.
- Keep the server instance stable while swapping the internal Hono app on refresh.

### Option merging

- Normalize options to an array (like the Vite plugin).
- `dir` resolved per entry relative to `root`.
- `prefix`, `include`, `exclude` applied per entry during scan.
- `watch` and `log` enabled only if all entries opt in (same as Vite plugin).
- `playground` resolved from the first entry that defines it, otherwise default to enabled at `/__mokup`.
- `host`, `port`, `root` use the first provided value or fall back to defaults.

### Refresh and watch

- `refresh()` rescans all entries and rebuilds the Hono app.
- Debounced file watching with chokidar, using resolved directories.
- On scan failure, keep the last successful app and log the error.

## Error handling

- If scanning fails on startup, keep an empty route table and still serve playground routes.
- Request errors return `500` with a plain text response and log the cause.
- Duplicate routes warn and continue.

## Tests

- Extend `packages/server/test/node-server.test.ts`:
  - `createFetchServer` starts, serves mock route, and exposes playground routes.
  - Supports `dir` arrays and `prefix`.
  - Node adapter can listen on port `0`.
  - `watch: false` does not create a watcher (assert via behavior if direct access is not available).

## Rollout notes

- Update docs to show the new dev-first API in Getting Started.
- Remove legacy `createMokupServer`/`startMokupServer` aliases.
