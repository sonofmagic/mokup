---
'@mokup/server': patch
---

Match mock routes before consuming request bodies in Node, Express, Koa, Fastify, Fetch, Hono, and Worker adapters. Unmatched requests retain their original streams for downstream handlers, while matched routes continue to accept raw and already-parsed bodies.
