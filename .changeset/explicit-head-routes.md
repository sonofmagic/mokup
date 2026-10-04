---
'@mokup/core': patch
'@mokup/runtime': patch
'@mokup/server': patch
'@mokup/shared': patch
---

Execute explicit HEAD routes before falling back to GET across development servers, Connect middleware, Fetch runtimes, and Service Workers. Preserve middleware, response hooks, route parameters, and mounted Hono error handlers while keeping HEAD responses bodyless and HEAD-only routes available for GET fallthrough. Cancel discarded HEAD response streams without losing representation headers such as Content-Length.
