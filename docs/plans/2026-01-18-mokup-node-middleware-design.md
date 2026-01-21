# Mokup Node Middleware Design

Superseded by `docs/plans/2026-01-18-mokup-server-design.md`.

## Goals

- Provide a single package, `@mokup/node`, that exposes framework-specific middlewares.
- Support Express/Connect, Koa, and Hono with consistent behavior.
- Keep runtime logic centralized and reuse the same request/response normalization.

## Non-goals

- Implement a fully generic middleware that runs unmodified in every framework.
- Rework mock file parsing or runtime matching logic.

## Package Overview

New package: `packages/node` (published as `@mokup/node`).

Exports:

- `createFetchHandler(options)` -> `(request: Request) => Promise<Response>`
- `createConnectMiddleware(options)` -> `(req, res, next)`
- `createKoaMiddleware(options)` -> `(ctx, next)`
- `createHonoMiddleware(options)` -> `(c, next)`
- `ServerOptions` type (extends runtime options + `onNotFound`).

## Architecture

- Core function `handleRuntimeRequest()` converts an incoming request into
  `RuntimeRequest` and calls `runtime.handle()`.
- A shared helper serializes the runtime result into a normalized response
  shape and applies headers/status/body consistently.
- Each adapter only handles framework-specific I/O (reading body and writing
  response).

## Request Parsing

- Query params -> `Record<string, string | string[]>`.
- Headers -> lower-case string map.
- Body parsing:
  - `application/json` or `+json` -> JSON.parse with fallback to raw text.
  - `application/x-www-form-urlencoded` -> object from `URLSearchParams`.
  - Otherwise -> raw text.
- `rawBody` preserved when available.

## Response Handling

- If no route matches:
  - `onNotFound: 'next'` -> call `next()`.
  - `onNotFound: 'response'` -> return 404 response.
- If matched:
  - Apply `status`, `headers`, and `delay` when present.
  - Body:
    - JSON/string -> send as text (JSON stringified if needed).
    - Binary -> send as `Buffer` in Connect, `Uint8Array` in Fetch/Hono/Koa.

## Usage Examples

```ts
import { createConnectMiddleware } from '@mokup/node'
import express from 'express'

const app = express()
app.use(createConnectMiddleware({ manifest }))
```

```ts
import { createKoaMiddleware } from '@mokup/node'
import Koa from 'koa'

const app = new Koa()
app.use(createKoaMiddleware({ manifest }))
```

```ts
import { createHonoMiddleware } from '@mokup/node'
import { Hono } from 'hono'

const app = new Hono()
app.use(createHonoMiddleware({ manifest }))
```

## Error Handling

- Invalid JSON bodies fall back to raw text.
- Runtime errors bubble to the framework error handler.

## Testing

- Unit tests for:
  - Connect middleware response status/headers/body.
  - Koa middleware next() behavior when not found.
  - Hono middleware response shape.
