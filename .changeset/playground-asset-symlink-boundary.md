---
"@mokup/core": patch
---

Keep Playground development and preview assets inside the configured distribution directory when resolving symbolic links. Requests that point through an external link now fall through to the next middleware instead of reading files outside the Playground asset root.
