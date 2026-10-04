---
"@mokup/core": patch
---

Reuse idle Vite SSR request identities across refreshes instead of adding an entry on every scan. Overlapping loads keep independent requests, successful identities are bounded by each input's peak concurrency, and server restarts and resolution failures retain fresh loading behavior.
