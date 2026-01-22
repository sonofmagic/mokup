# Mock Rules

A mock file can export a single rule or an array. Rule fields:

- `handler`: response content or handler function (required)
- `status`: status code
- `headers`: response headers
- `delay`: delay in ms

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
  handler: { ok: true },
}
```

Array exports are supported, but each entry still uses file-based routing.

## Faker integration

Use `@faker-js/faker` in TS/JS handlers to generate realistic mock data:

```ts
import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = () => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  createdAt: faker.date.recent({ days: 30 }).toISOString(),
})

export default handler
```

Optional: seed the generator for reproducible output (place this once in a shared module):

```ts
import { faker } from '@faker-js/faker'

faker.seed(123)
```
