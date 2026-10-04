---
"@mokup/query": patch
---

Reject non-2xx responses in the default Fetch executor with an exported MokupHttpError that preserves the original, unread Response and exposes its status and statusText. Custom transformResponse handlers continue to control all status handling and response parsing.

JSON-encode plain object and array request bodies, including null-prototype and cross-realm objects, and add application/json only when Content-Type is absent. Preserve explicit content types and native Fetch body values.
