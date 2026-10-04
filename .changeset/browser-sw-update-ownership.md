---
'mokup': patch
---

Keep the current page and automatic Service Worker update queue alive when worker runtime entries all use SW mode with server fallback disabled. Avoid redundant full-page reloads for these browser-only updates, while retaining empty-to-nonempty registration bootstrapping and existing refresh behavior for server routes, fallback routes, and manual registration.
