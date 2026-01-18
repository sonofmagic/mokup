# Mock Rules

A mock file can export a single rule or an array. Rule fields:

- `response`: response content (required)
- `status`: status code
- `headers`: response headers
- `delay`: delay in ms
- `method`: override file method
- `url`: override route path

## JSON / JSONC

Return JSON directly, comments and trailing commas are supported:

```jsonc
{
  // user profile
  "id": 1,
  "name": "Ada"
}
```

## TS/JS

Export an object or array:

```ts
export default {
  status: 201,
  headers: { 'x-mock': 'ok' },
  response: { ok: true },
}
```

Multiple rules:

```ts
export default [
  { method: 'get', url: '/users', response: [] },
  { method: 'post', url: '/users', response: { ok: true } },
]
```

## Override route

```ts
export default {
  method: 'post',
  url: '/auth/login',
  response: { ok: true },
}
```
