# Mokup Node Dev Server Design

## Goals

- Provide a zero-build Node.js dev server API that starts mock routing with a single `dir` option.
- Add a CLI command that starts the same server (`mokup serve`).
- Default experience includes watch and Playground.

## Non-Goals

- No production build output or bundling flow.
- No HMR integration outside Vite; Playground refresh is manual.

## Proposed API

### Library

- Add `createFetchServer` under `mokup/server`.
- Default options:
  - `dir: 'mock'`
  - `prefix: ''`
  - `host: 'localhost'`
  - `port: 8080`
  - `watch: true`
  - `playground: true` (path `/_mokup`)
  - `log: true`

Example:

```ts
import { serve } from '@hono/node-server'
import { createFetchServer } from 'mokup/server'

const app = await createFetchServer({ dir: 'mock' })
serve({ fetch: app.fetch, port: 3000 })
```

### CLI

- New command: `mokup serve`.
- Options: `--dir/-d`, `--prefix`, `--include`, `--exclude`, `--host`, `--port`, `--no-watch`, `--no-playground`, `--log/--no-log`.
- CLI delegates to `createFetchServer`.

## Architecture

- Reuse Vite-side utilities to avoid re-implementing core behavior:
  - `scanRoutes` to build route table.
  - `createHonoApp` and `createMiddleware` to serve mocks.
  - `createPlaygroundMiddleware` to serve Playground UI.
- Build a minimal middleware chain over Node `http`:
  1. Playground middleware (when enabled).
  2. Mock middleware.
  3. Default 404 response.
- Watch mode uses `chokidar` to rescan routes and rebuild the Hono app on file changes.

## Data Flow

- On startup, resolve dirs, scan routes, build Hono app.
- Requests flow through playground -> mock -> 404.
- When files change and watch is enabled:
  - rescan routes
  - rebuild app
  - log updates

## Error Handling

- Route scan and load issues log warnings, but do not crash the server.
- Runtime mock errors return 500 and log errors.

## Testing

- Unit tests for `createFetchServer`:
  - Responds to a JSON mock route.
  - `/ _mokup/routes` returns entries when playground is enabled.
  - Watch mode refreshes route table after file changes.

## Open Questions

- None.
