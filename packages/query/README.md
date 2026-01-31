# @mokup/query

TanStack Query integrations for Mokup request switching.

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
