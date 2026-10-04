---
'@mokup/runtime': minor
---

Add `runtime.hasRoute({ method, path })` so adapters can check route ownership before consuming a request body. Preserve the same method, HEAD fallback, and path priorities as `runtime.handle`, and share one cached manifest across concurrent checks and requests while allowing failed manifest loads to retry.
