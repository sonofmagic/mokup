---
'@mokup/core': patch
---

Handle invalid HTTP request URLs without leaving rejected middleware promises and preserve leading double slashes in request paths. Read mock response bodies and validate Node response headers before committing the response so stream or header failures return a complete 500 response without stale content or cookie headers.
