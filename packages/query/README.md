# @mokup/query

TanStack Query integrations for Mokup request switching.

## Requirements

- Node.js `^20.19.0 || >=22.12.0`

## Upgrade notes

- This package now ships ESM-only output.
- Full migration guide: [../../docs/guide/migration-v1.md](../../docs/guide/migration-v1.md)

## Install

```bash
pnpm add @mokup/query @mokup/client
```

## Quick start (global defaults)

```ts
import { applyMokupToQueryClient } from '@mokup/query'
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()

applyMokupToQueryClient(queryClient, {
  resolverOptions: {
    mockBase: 'http://localhost:3300',
    realBase: 'https://api.example.com',
    pathMap: [{ from: '/api/*', to: '/*' }],
    markers: { header: true },
  },
})
```

## Query key convention

Default `queryKey` shapes:

```ts
const keyA = ['GET', '/users', { params, headers, body, mock: true }]
const keyB = ['/users', { params, mock: true }]
```

Per-request override using `meta`:

```ts
useQuery({
  queryKey: ['GET', '/users'],
  meta: { mokup: true },
})
```

If your app already has custom query keys, provide `buildRequest` to map them.

## Custom request mapping

```ts
import { createMokupQueryClient } from '@mokup/query'

const { queryFn, mutationFn } = createMokupQueryClient({
  buildRequest(queryKey, meta) {
    const [resource, params] = queryKey as [string, Record<string, unknown>?]
    return {
      url: resource,
      method: 'GET',
      params,
      meta,
    }
  },
})
```

## Using axios

```ts
import { applyMokupToQueryClient, createAxiosExecutor } from '@mokup/query'
import axios from 'axios'

const executor = createAxiosExecutor({
  axios,
  resolverOptions: {
    mockBase: 'http://localhost:3300',
    realBase: 'https://api.example.com',
  },
})

applyMokupToQueryClient(queryClient, { executor })
```

You can also pass an Axios instance created with `axios.create()`. The executor
reads its current `defaults.baseURL` and `defaults.allowAbsoluteUrls` on every
request, combines the URL using Axios rules, then applies the Mokup resolver.
For example, a base URL ending in `/api/v1` and a query URL `/users` retain the
`/api/v1/users` path. No request interceptor is installed on the instance.

## Using fetch

```ts
import { applyMokupToQueryClient, createFetchExecutor } from '@mokup/query'

const executor = createFetchExecutor({
  resolverOptions: {
    mockBase: 'http://localhost:3300',
    realBase: 'https://api.example.com',
  },
})

applyMokupToQueryClient(queryClient, { executor })
```
