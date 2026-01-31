# Mokup Client Request Switching Design

## Context

Users want a fast, low-friction way to switch requests between local Mokup and remote SIT/production.
The preferred workflow is **explicit per-request override** (e.g., `mokup: true`) plus **global switches**,
while keeping existing request libraries (axios/fetch/XHR/wx.request) and query layers (TanStack Query).

## Goals

- Provide a **client-side package** that can switch requests to Mokup with minimal integration effort.
- Support **multi-runtime** usage: browser, mini-program (wx.request), and Node/SSR fetch.
- Offer **per-request override** with a clear **priority chain** and light configuration.
- Provide **official adapters/plugins** for axios, fetch, XHR, and TanStack Query (React/Vue).
- Support **origin replacement** and **path prefix mapping**.

## Non-goals

- Replacing existing HTTP clients with a new requester.
- Requiring service worker usage (optional or separate feature).
- Changing Mokup route conventions or server behavior.

## High-level Approach

Add a new client-facing entry that separates concerns into:

1. **Core resolver**: decides whether a request is mock or real, and rewrites URL/headers.
2. **Adapters**: thin bridges that translate library-specific requests into a unified descriptor
   and apply resolver results back to the library.
3. **Query plugins**: integrate with TanStack Query by providing default `queryFn`/`mutationFn`
   and per-query overrides via `meta`.

## Package Layout

- `mokup/client`
  - core resolver and request factory
  - adapters: axios, fetch, xhr, wx
  - global switch helpers
- `mokup/query`
  - TanStack Query plugin: `applyMokupToQueryClient` and `createMokupQueryClient`

## Core Types

```ts
export interface RequestDescriptor {
  url: string
  method?: string
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean>
  body?: unknown
  mock?: boolean
  meta?: Record<string, unknown>
}

export interface ResolveResult {
  mode: 'mock' | 'real'
  url: string
  headers: Record<string, string>
  meta?: {
    reason?: string
    warning?: string
  }
}
```

## Resolver Priority Chain

Order (highest to lowest):

1. **Per-request override**: `mock` or `meta.mokup`.
2. **Request markers**: header/cookie/query (e.g., `x-mokup: 1`, `mokup=1`).
3. **Global switch**: `setUseMock()` value.
4. **Environment defaults**: `MOKUP_USE_MOCK`.

If a URL is absolute and the host is outside the configured target domains, the resolver **must not** rewrite it.

## URL Rewriting Rules

- Default: **replace origin** using `mockBase` or `realBase`.
- Optional: **path prefix map**, e.g. `/api/* -> /*` or `/v1/* -> /mock/*`.
- Avoid double-prefixing when the URL already matches the target prefix.

## Debug Markers

When `debug` is enabled:

- Inject `x-mokup: 1` and `x-mokup-mode: mock|real` headers.
- Optional query flag: `?__mokup=1`.

## Public APIs (Draft)

```ts
export interface MockResolverOptions {
  mockBase?: string
  realBase?: string
  pathMap?: Array<{ from: string, to: string }>
  allowHosts?: string[]
  markers?: { header?: boolean, query?: boolean }
  env?: { useMock?: boolean | string }
  storage?: {
    get: () => boolean | undefined
    set: (value: boolean) => void
  }
}

export function createMockResolver(options?: MockResolverOptions): {
  resolve: (req: RequestDescriptor) => ResolveResult
  setUseMock: (value: boolean, persist?: boolean) => void
  getUseMock: () => boolean | undefined
}

export function createRequest(options: {
  adapter: 'fetch' | 'axios' | 'xhr' | 'wx'
  resolver?: ReturnType<typeof createMockResolver>
  debug?: boolean
}): { request: (input: unknown) => Promise<unknown> }
```

## Adapters

- **fetch**: wraps `fetch(input, init)` and rewrites URL/headers before dispatch.
- **axios**: interceptor or adapter helper that rewrites `config.baseURL` and `config.url`.
- **xhr**: wrapper that rewrites URL at `open()` and injects headers in `setRequestHeader()`.
- **wx.request**: wraps options and rewrites `url/header`.

All adapters use the same resolver. They must not swallow network errors; only rewrite request config.

## TanStack Query Integration (`mokup/query`)

- `applyMokupToQueryClient(queryClient, options)`
  - sets `defaultOptions.queryFn` and `defaultOptions.mutationFn`.
- `createMokupQueryClient(options)`
  - returns `queryFn`, `mutationFn`, and helpers for `queryKey` construction.

Default `queryKey` convention:

```ts
['GET', '/users', { params, headers, body }]
```

Per-query override via `meta`:

```ts
useQuery({
  queryKey: ['GET', '/users'],
  meta: { mokup: true },
})
```

Custom `buildRequest(queryKey, meta)` is supported to map existing key shapes.

## Error Handling

- Resolver must **never throw** for invalid URL. If parsing fails, return `mode: 'real'` with a warning.
- Adapters preserve original error behavior of their libraries.

## Testing Plan

- Resolver:
  - priority chain correctness
  - origin replacement
  - pathMap rewriting (including no double-prefix)
  - ignore non-target domains
- Adapters:
  - axios config rewrite
  - fetch wrapper url/header rewrite
  - xhr open/header rewrite
  - wx.request option rewrite
- TanStack:
  - global defaults and `meta.mokup` override
  - custom `buildRequest` support

## Rollout

1. Add `mokup/client` core + adapters.
2. Add `mokup/query` plugins for React/Vue Query.
3. Update docs: show per-request override, global toggle, and TanStack integration.
