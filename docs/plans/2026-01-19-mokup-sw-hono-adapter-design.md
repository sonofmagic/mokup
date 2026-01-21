---
title: Mokup SW Hono Adapter Design
date: 2026-01-19
status: accepted
---

# Mokup SW Hono Adapter Design

## Overview

We will move the service worker runtime to Hono so server and SW share the same
Hono route generation. The SW will build a Hono app from the existing manifest
and register a `fetch` listener via `hono/service-worker`. The SW should only
intercept mock API traffic (defaulting to the `prefix` from each `mode: 'sw'`
entry) while allowing the base paths to be configured through `sw.basePath`.

## Goals

- Use Hono in SW to align behavior with server routing.
- Allow configurable interception scope with sensible defaults.
- Keep current mock route format and module loading behavior.
- Preserve fallback to network when mocks do not match.

## Configuration

- Add `sw.basePath?: string | string[]` to `ServiceWorkerOptions`.
- If `sw.basePath` is not provided, default to `prefix` for each SW entry.
- Normalize base paths to leading slash, no trailing slash (except `/`).

## Data Flow

1. Plugin scans routes and builds a manifest (unchanged).
2. `buildSwScript` emits a SW module that:
   - imports `createRuntimeApp` from `mokup/runtime`.
   - imports `handle` from `hono/service-worker`.
   - builds `moduleMap` for rule/middleware modules.
   - creates a Hono app via `await createRuntimeApp({ manifest, moduleMap })`.
   - filters fetch events by `basePaths` before handing them to Hono.
3. `handle(app)` responds, falling back to network on 404.

## Error Handling

- If SW app construction fails, log once and fall back to `fetch`.
- Request-time errors should not break the page; Hono fallback behavior applies.

## Testing

- Unit test `buildSwScript` output for `handle(app)` and base path filtering.
- Regression check that dev SW uses `/@id/...` imports.
- Manual: verify `/api` is mocked, other paths pass through.
