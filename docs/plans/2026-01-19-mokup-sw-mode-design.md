# Mokup Vite SW Mode Design

## Goals

- Allow per-entry mock mode selection in `mokup/vite` (server vs service worker).
- Support both `vite dev` and `vite build/preview`.
- Keep current server mode behavior intact by default.
- Provide a small browser API for manual SW registration.

## API Surface

- `VitePluginOptions.mode?: 'server' | 'sw'` (default `server`).
- `VitePluginOptions.sw?: { path?: string; scope?: string; register?: boolean; fallback?: boolean }`
  - `path` default `/mokup-sw.js`.
  - `scope` default `/`.
  - `register` default `true` (auto inject registration script).
  - `fallback` default `true` (SW routes still served by server middleware).
- New entry `mokup/sw` exports `registerMokupServiceWorker(options)`.

## Architecture

- `mokup/vite` scans routes for all entries, then splits them into:
  - `serverRoutes` (server mode + SW entries with fallback).
  - `swRoutes` (SW mode entries only).
- `serverRoutes` keep current Hono-based middleware handling.
- `swRoutes` are compiled into a SW script:
  - Generates a runtime manifest from resolved routes.
  - Builds a `moduleMap` by importing mock modules and converting `RouteRule` to runtime rules.
  - Uses `@mokup/runtime` to match requests and respond; falls back to `fetch()` when unmatched.

## Data Flow

1. Vite plugin scans mock directories (same as today).
2. For SW mode entries:
   - Determine inline responses (json/text/binary).
   - Use module references for function handlers (or Response handlers).
   - Collect middleware module references from directory config.
3. Generate SW script:
   - Static `manifest`.
   - `moduleMap` with adapted rule exports.
   - `fetch` event handler to run runtime and fall back to network.
4. Dev server serves `/mokup-sw.js` dynamically.
5. Build emits SW file via a virtual module.

## HTML Injection & Registration

- When SW routes exist and `sw.register !== false`, inject:
  - `<script type="module">` that calls `registerMokupServiceWorker({ path, scope })`.
  - Hooks Vite HMR `mokup:routes-changed` to call `registration.update()`.
- `path`/`scope` are resolved relative to Vite `base`.
- Manual usage is supported via `mokup/sw`.

## Error Handling

- Failures to generate SW script return a 500 in dev/preview.
- Registration errors are caught and logged in browser console.
- Conflicting `sw.path`/`sw.scope` across entries warn and keep the first value.

## Testing Plan

- Add unit tests for:
  - SW manifest generation (function handlers -> module refs).
  - Middleware module refs and ruleIndex propagation.
  - Base path resolution for registration path/scope.
- Manual verification:
  - `vite dev` with `mode: 'sw'` and mixed entries.
  - `vite build && vite preview` with SW registration working.
