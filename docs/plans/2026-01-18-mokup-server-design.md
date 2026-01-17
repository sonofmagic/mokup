# Mokup Server Adapters Design

## Goals

- Provide a single package, `@mokup/server`, that exposes framework-specific adapters.
- Support Fetch, Express, Connect, Koa, Hono, and Fastify with consistent behavior.
- Keep runtime logic centralized and reuse the same request/response normalization.
- Remove `@mokup/hono` and migrate all usage to `@mokup/server`.

## Non-goals

- Rework mock manifest generation or route matching logic.
- Provide a single middleware that runs unmodified in every framework.
- Implement runtime-specific features outside request/response adaptation.

## Package Overview

New package: `packages/server` (published as `@mokup/server`).

Exports (function-based API only):

- `createFetchHandler(options)` -> `(request: Request) => Promise<Response>`
- `createExpressMiddleware(options)` -> `(req, res, next)`
- `createConnectMiddleware(options)` -> `(req, res, next)`
- `createKoaMiddleware(options)` -> `(ctx, next)`
- `createHonoMiddleware(options)` -> `MiddlewareHandler & { routes }`
- `createFastifyPlugin(options)` -> `FastifyPluginAsync`
- `MokupServerOptions` type

Options shape:

- Extends `RuntimeOptions` (`manifest`, `moduleBase`).
- Adds `onNotFound?: 'next' | 'response'`.

## Architecture

- Create a shared runtime instance via `createRuntime(options)`.
- Normalize incoming framework requests into a `RuntimeRequest`:
  - `method`, `path`, `query`, `headers`, `body`, and optional `rawBody`.
- Call `runtime.handle()` to obtain `RuntimeResult`.
- Apply status/headers/body uniformly across adapters.

## Request Parsing

- Query params -> `Record<string, string | string[]>`.
- Headers -> lower-case `Record<string, string>`.
- Body parsing:
  - `application/json` or `+json` -> JSON.parse with fallback to raw text.
  - `application/x-www-form-urlencoded` -> object from `URLSearchParams`.
  - Otherwise -> raw text.
- `rawBody` retained when available.

## Response Handling

- If no route matches:
  - `onNotFound: 'next'` -> delegate to framework next handler.
  - `onNotFound: 'response'` -> 404 response.
- If matched:
  - Apply `status`, `headers`, and `delay` if present in result.
  - Body handling:
    - `string` -> send as text.
    - `Uint8Array`/`ArrayBuffer` -> send as binary.
    - JSON-like -> stringify with `application/json; charset=utf-8`.

## Framework Adapters

- Fetch: `Request` in, `Response` out. Used for Edge/Worker/Node fetch runtimes.
- Express/Connect: `(req, res, next)` middleware, respects `onNotFound`.
- Koa: `async (ctx, next)` middleware, writes `ctx.status/ctx.body/ctx.set`.
- Hono: adapter returns middleware with `routes` array for `app.use`/`app.route`.
- Fastify: plugin-based adapter via `fastify.register(createFastifyPlugin(...))`.

## Migration

- Remove `packages/hono` and update all references to `@mokup/server`.
- Update docs and examples to use the new adapters.

## Usage Examples

```ts
import { createExpressMiddleware } from '@mokup/server'
import express from 'express'

const app = express()
app.use(createExpressMiddleware({ manifest }))
```

```ts
import { createFastifyPlugin } from '@mokup/server'
import Fastify from 'fastify'

const app = Fastify()
await app.register(createFastifyPlugin({ manifest }))
```

```ts
import { createFetchHandler } from '@mokup/server'

const handler = createFetchHandler({ manifest })
const response = await handler(new Request('https://example.com/api'))
```

## Error Handling

- JSON parsing errors fall back to raw text.
- Runtime errors bubble to the framework error handler.

## Testing

- Unit tests for:
  - Connect/Express middleware response status/headers/body.
  - Koa next() behavior on not found.
  - Hono middleware response shape and `routes` array.
  - Fastify plugin responding correctly and honoring `onNotFound`.
- Basic fetch adapter tests for Request -> Response conversion.
