# Mokup Ignore Routes and Index Strategy Design

## Goals

- Provide a direct way to ignore specific mock routes or subtrees.
- Keep `/api/index` behavior aligned with Next/Nuxt file routing.
- Ensure Vite plugin and CLI manifest output stay consistent.

## Non-goals

- Do not change default index merging behavior.
- Do not add JSON/JSONC per-file enable/disable flags.
- Do not introduce explicit route override fields in handlers.

## Proposed Configuration

- **Global (Vite/CLI):** `ignorePrefix?: string | string[]` with default `'.'`.
  - Any path segment (directory or filename) starting with one of these prefixes is ignored.
- **Directory (`index.config.ts`):**
  - `ignorePrefix?: string | string[]`
  - `include?: RegExp | RegExp[]`
  - `exclude?: RegExp | RegExp[]`
  - These override the current effective values for their subtree ("nearest wins").
- **Per-file (TS/JS only):** `enabled?: boolean` in `RouteRule`.
  - `enabled: false` skips that rule; JSON/JSONC remain unchanged.

## Routing Strategy for `/api/index`

- Keep index merge behavior.
- To produce `/api/index`, use a nested folder:
  - `mock/api/index/index.get.ts` -> `GET /api/index`
  - `mock/api/index.get.ts` -> `GET /api`

## Scanning and Filtering

- Filter on `ignorePrefix` during file collection, before extension checks.
- After resolving directory config, apply `exclude` then `include`.
- Drop rules with `enabled: false` for TS/JS modules.
- Apply the same logic in Vite scan and CLI manifest generation to keep parity.

## Testing Notes

- Add unit tests covering:
  - Global `ignorePrefix` and directory overrides.
  - Directory `include/exclude` precedence.
  - `enabled: false` skipping a single rule.
  - `/api/index` example via nested `index/` folder (doc example).
