# Mokup: A Unified Runtime Mock Library

I built a mock library called Mokup because I wanted one set of mock routes to
run everywhere: local dev, Node servers, Service Workers, and Cloudflare
Workers. Most mock tools are great in one place but fall apart when you move
from browser to server to edge. Mokup’s goal is to make that transition boring.

## What Mokup does

Mokup is a file-based HTTP mock library with a shared runtime. You write mock
files once, and Mokup runs them across:

- Vite dev server middleware
- Service Worker mode in the browser
- Node server adapters (Express, Koa, Fastify, Hono, Connect)
- Worker runtimes via a fetch handler or Worker entry

It gives you a consistent request handler, a manifest format, and build outputs
that can be reused across environments.

## How it works (in one minute)

1. Mokup scans your `mock/` directory and builds a manifest of routes.
2. A shared runtime matches requests and produces responses.
3. Adapters (Vite, Node middleware, Workers) call into the same runtime.
4. For production or Worker environments, you can build a bundle that contains
   both the manifest and handler modules.

That’s it: one routing model, one runtime, multiple adapters.

## Quick start

Install and wire the Vite plugin:

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      entries: { dir: 'mock', prefix: '/api' },
    }),
  ],
}
```

Add a mock handler:

```ts
// mock/users.get.ts
export default {
  handler: c => c.json([{ id: 1, name: 'Ada' }]),
}
```

Start Vite and hit `/api/users` — the same routes can later run in Node or
Workers without rewriting.

## Deploying the same mocks to Workers

When you build for Workers, you can import a virtual bundle from Vite and use
the worker helper:

```ts
import { createMokupWorker } from 'mokup/server/worker'
import mokupBundle from 'virtual:mokup-bundle'

export default createMokupWorker(mokupBundle)
```

If you prefer a fetch handler:

```ts
import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from 'virtual:mokup-bundle'

const handler = createFetchHandler(mokupBundle)
export default { fetch: request => handler(request) }
```

## Why it’s useful

- One mock source of truth across dev and deploy
- Works in browser, Node, and Worker runtimes
- File-based routing keeps mocks close to the code
- Service Worker mode lets you mock without a backend proxy
- Manifest/bundle outputs make CI/CD and deployments predictable

## Who it’s for

- Frontend teams that want stable mocks across local and preview builds
- Full-stack teams that run the same mocks in Node and edge
- Tooling authors who need a runtime-agnostic mock layer
- QA and DX workflows that need reproducible fixtures

## Where to start

- Vite users: `mokup/vite` for local dev and SW mode
- Node servers: `mokup/server/node` adapters
- Workers: `mokup/server/worker` or `mokup/server/fetch`
- CLI: `mokup build` to produce bundle outputs

If you want a single set of mocks that can move with your app—from local dev to
edge—Mokup is built for that.
