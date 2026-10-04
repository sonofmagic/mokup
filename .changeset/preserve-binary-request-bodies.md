---
"@mokup/runtime": patch
"@mokup/server": patch
"mokup": patch
---

Preserve original request bytes when server adapters reconstruct Fetch requests, fixing binary and multipart file uploads without changing existing parsed body or raw text fields. Runtime requests can provide optional `rawBodyBytes`, which takes precedence over `rawBody` and `body`, including empty byte arrays and sliced buffers.
