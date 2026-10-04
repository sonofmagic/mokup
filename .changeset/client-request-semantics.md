---
"@mokup/client": patch
"@mokup/query": patch
---

Preserve native Fetch Request body, init override, cancellation, keepalive, and redirect semantics. Buffer bodies when rewriting Request URLs so binary and multipart payloads remain replayable.

Preserve Axios base URL paths, absolute URL policy, protocol-relative host checks, and current instance defaults in both the client adapter and query executor. Keep native Axios header values and invalid URL rejection, and correct the Axios type augmentation.
