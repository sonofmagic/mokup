# Overview

Mokup is a file-driven mock toolchain that covers both dev and deployment:

- **Dev**: `mokup/vite` intercepts requests in Vite dev and returns mock responses.
- **Build**: CLI generates `.mokup` output (manifest + handlers).
- **Runtime**: `mokup/runtime` handles matching, delays, headers, and responses.
- **Adapters**: `mokup/server/node` provides Express/Koa/Hono/Fastify; `mokup/server` provides fetch handlers.

Use it when:

- Frontend and backend develop in parallel.
- You need deployable mock assets (e.g. Workers).
- You want one ruleset across multiple runtimes.
