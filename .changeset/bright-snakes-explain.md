---
"mokup": patch
---

- Register mock middleware before Vite HTML fallback so SPA `/api/*` routes hit mokup.
- Only inject the SW unregister script when `sw.unregister` is explicitly enabled.
