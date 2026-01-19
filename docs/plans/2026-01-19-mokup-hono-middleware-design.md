# Mokup Hono-first middleware design

## Goal

Make Mokup handlers and middleware use Hono `Context` directly, and expose a Vite
adapter that bridges Hono into Vite dev/preview middleware. All examples and
docs should use Hono-style handlers.

## Scope

- `@mokup/runtime` executes Hono handlers.
- `mokup/vite` builds a Hono app and exposes a Connect-style adapter for Vite.
- Mock handler signatures change to `(c) => Response | Promise<Response>`.
- Update docs and examples to Hono style.

## Runtime design

- Compile manifest routes into a Hono app with a Hono router (PatternRouter).
- Convert file-based templates to Hono paths:
  - `[id]` -> `:id`
  - `[...slug]` -> `:slug{.+}`
  - `[[...slug]]` -> `:slug{.+}?`
- Register routes in score order so earlier routes win.
- Run manifest middleware using Hono middleware signature `(c, next)`.
- Response handling:
  - If handler returns a Response, use it.
  - If handler returns `string | object | Uint8Array`, wrap using `c.text`,
    `c.json`, or `c.body`.
  - Apply route `headers/status/delay` after handler.

## Vite adapter

- Build a Hono app from scanned routes (same runtime route conversion).
- Provide `createViteMiddleware(app)` that:
  - Checks `app.router.match(method, path)` to decide if a route matches.
  - If no match, call `next()`.
  - If match, convert Node request to `Request`, call `app.fetch`, and write the
    Response to the Node response.
- Keep playground middleware behavior unchanged, only reroute mock handlers.

## Public API updates

- `mokup` handler type becomes `MockHandler = (c: Context) => Response | Promise<Response>`.
- `MockMiddleware` becomes Hono middleware.
- Examples/docs migrate from `(req, res, ctx)` to Hono `Context` usage:
  - `c.req.param()` for path params
  - `c.req.query()` for query
  - `await c.req.json()` for JSON body
  - `c.header()` and `c.status()`

## Testing

- Update unit tests for runtime and Vite middleware to assert:
  - Params parsing with `[id]`, `[...slug]`, `[[...slug]]`
  - Middleware ordering
  - Response types and headers
- Smoke test apps:
  - `pnpm --filter web dev`
  - `pnpm --filter docs dev`
