# Node server dev API design

## Goal

Provide a simple dev-mode API that runs mocks from `dir` with hot reload and a Node-friendly `listen()` API:

```ts
import { createNodeServer } from 'mokup/server'

const app = createNodeServer({ dir: 'mock' })
await app.listen(3000)
```

The API should mirror the Vite plugin options where reasonable and always run in mock server mode (no SW).

## Scope

- Add `createNodeServer` to `mokup/server`.
- Accept a single options object or an array of options objects.
- Support Vite-like dev options: `dir`, `prefix`, `include`, `exclude`, `watch`, `log`, `playground`.
- Support server options: `host`, `port`, `root`.
- Keep existing `createMokupServer`/`startMokupServer` for backward compatibility.

Out of scope:

- Service Worker mode.
- Build-mode bundling (still available via existing runtime/server APIs).

## API shape

```ts
export function createNodeServer(
  options?: MokupNodeServerOptions | MokupNodeServerOptions[],
): MokupNodeServer

export interface MokupNodeServer {
  server: import('@hono/node-server').ServerType
  listen: (port?: number, host?: string) => Promise<{ host: string, port: number }>
  close: () => Promise<void>
  refresh: () => Promise<void>
  getRoutes: () => RouteTable
}
```

Behavior:

- `listen()` performs the initial scan before binding the port.
- `listen(port, host)` overrides configured defaults for that call.
- Returns `{ host, port }` for logging and dynamic port use.

## Implementation plan

### Core wiring

- Reuse the existing dev scanner, route builder, and playground logic under `packages/server/src/dev/*`.
- Build the Hono app from scanned routes and mount playground routes if enabled.
- Create the Node server using `@hono/node-server` `createAdaptorServer({ fetch: (...args) => app.fetch(...args) })`.
- Keep the server instance stable while swapping the internal Hono app on refresh.

### Option merging

- Normalize options to an array (like the Vite plugin).
- `dir` resolved per entry relative to `root`.
- `prefix`, `include`, `exclude` applied per entry during scan.
- `watch` and `log` enabled only if all entries opt in (same as Vite plugin).
- `playground` resolved from the first entry that defines it, otherwise default to enabled at `/_mokup`.
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
  - `createNodeServer` starts, serves mock route, and exposes playground routes.
  - Supports `dir` arrays and `prefix`.
  - `listen(0)` returns a working dynamic port.
  - `watch: false` does not create a watcher (assert via behavior if direct access is not available).

## Rollout notes

- Update docs to show the new dev-first API in Getting Started.
- Keep `createMokupServer` and `startMokupServer` as legacy aliases.
