# @mokup/client

Client-side request switching utilities and adapters for Mokup.

## Requirements

- Node.js `^20.19.0 || >=22.12.0`

## Upgrade notes

- This package now ships ESM-only output.

## Install

```bash
pnpm add @mokup/client
```

## Quick start (fetch)

```ts
import { createFetchAdapter, createMockResolver } from '@mokup/client'

const resolver = createMockResolver({
  mockBase: 'http://localhost:3300',
  realBase: 'https://api.example.com',
  pathMap: [{ from: '/api/*', to: '/*' }],
  markers: { header: true },
})

const mokupFetch = createFetchAdapter({ resolver })

await mokupFetch('/api/users', { mock: true })
```

## Quick start (axios)

```ts
import { applyMokupToAxios } from '@mokup/client'
import axios from 'axios'

const api = axios.create({ baseURL: 'https://api.example.com' })

applyMokupToAxios(api, {
  resolverOptions: {
    mockBase: 'http://localhost:3300',
    realBase: 'https://api.example.com',
    pathMap: [{ from: '/api/*', to: '/*' }],
  },
})

await api.request({ url: '/api/users', mock: true })
```

## Resolver options

- `mockBase`: mock server origin or base path
- `realBase`: real API origin or base path
- `pathMap`: prefix rewrite rules (`/api/* -> /*`)
- `allowHosts`: only rewrite matching hosts
- `markers`: inject headers or query markers (`x-mokup`, `__mokup`)
- `storage`: persist global toggle (optional)

## Overrides and priority

Order (highest to lowest):

1. Request `mock` or `meta.mokup`
2. Headers/cookie/query markers
3. Global `setUseMock`
4. `resolverOptions.env.useMock`

## Global switch

```ts
const resolver = createMockResolver({ mockBase, realBase })
resolver.setUseMock(true)

const useMock = resolver.getUseMock()
```
