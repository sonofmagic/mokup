---
'@mokup/server': patch
---

Preserve separate Set-Cookie fields across Node, Koa, Fastify, Fetch, Hono, and Worker adapters, including cookies with Expires dates. Native Node and Koa responses append the complete cookie list; custom response shapes with only scalar header setters retain their previous behavior and can opt in with appendHeader or append.

Register Fastify hooks in the parent scope so standard plugin registration handles mock requests. Preserve Koa HEAD status and headers after assigning the body, and send binary responses as buffers so Koa does not serialize them as JSON.
