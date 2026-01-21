# Mokup Directory Config and Middleware Design

## Goals

- Remove route overrides from `RouteRule` (no `url`/`method` fields).
- Add directory-scoped configuration via `index.config.ts`.
- Support middleware chains applied from root to leaf directories.
- Surface middleware/config impact in Playground UI.

## Non-goals

- Change route template syntax or file naming conventions.
- Add runtime scripting beyond middleware and handler functions.
- Introduce a global plugin system outside directory configs.

## Directory Config (`index.config.ts`)

Each directory can export a config object that applies to files in the directory and all descendants.

Supported fields:

- `headers?: Record<string, string>`
- `status?: number`
- `delay?: number`
- `enabled?: boolean`
- `middleware?: Middleware | Middleware[]`

`Middleware` signature:

```
async (req, res, ctx, next) => void
```

## Inheritance and Precedence

- Configs are resolved from root to leaf (closest directory wins).
- Fields are merged cumulatively:
  - `headers`: shallow merge (parent first, child overrides).
  - `status`, `delay`, `enabled`: child overrides parent.
  - `middleware`: concatenated array (parent first, child last).

## Route Resolution

- `RouteRule` no longer accepts `url` or `method`.
- Route method and template are derived from file path only.
- Rules can still set `status`, `headers`, `delay`, `response`.

## Middleware Execution

- The middleware chain for a route is collected from all configs in its directory ancestry.
- Execution order is root -> leaf -> route handler.
- Middleware can short-circuit by not calling `next()`.

## Playground Visibility

- Route list includes a middleware count indicator.
- Route detail view shows middleware origin (directory path) and order.
- Directory group view includes a small summary of config (headers/status/delay).

## Outputs

- Vite plugin applies configs and middleware at runtime.
- CLI build records middleware as module-based responses (for worker/server usage).

## Testing

- CLI unit test: directory config inheritance and middleware ordering.
- Vite plugin test: config merge, route disablement, middleware count.
- Playground test: route metadata includes middleware count and sources.
