# File Routing

Mokup turns file paths into routes. Key rules:

## Method suffix

Files must include an HTTP method suffix (`.get`, `.post`, etc.):

```
mock/users.get.json   -> GET /users
mock/users.post.ts    -> POST /users
```

In the Vite plugin, `.json/.jsonc` files default to `GET` if no suffix is present. For CLI builds, an explicit suffix is recommended.

## index routes

`index` maps to the directory root:

```
mock/index.get.json       -> GET /
mock/users/index.get.ts   -> GET /users
```

## Dynamic params

Use brackets:

```
mock/users/[id].get.ts    -> GET /users/:id
```

Access via `c.req.param('id')`:

```ts
export default {
  handler: c => ({ id: c.req.param('id') }),
}
```

Tip: you can wrap route exports with `defineHandler` for better IntelliSense:

```ts
import { defineHandler } from 'mokup'

export default defineHandler({
  handler: c => ({ id: c.req.param('id') }),
})
```

## Catch-all and optional segments

```
mock/docs/[...slug].get.ts   -> /docs/* (at least 1 segment)
mock/docs/[[...slug]].get.ts -> /docs (optional)
```
