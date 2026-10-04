---
'@mokup/query': patch
---

Return an empty string for successful HEAD requests and HTTP 204/205 responses in the default Fetch executor, including responses with a JSON content type. Preserve HTTP errors, JSON parse errors on ordinary successful responses, and custom transform ownership of response handling.
