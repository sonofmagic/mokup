---
"mokup": patch
---

Align the built Service Worker file with its registration URL when `sw.path` already includes the complete Vite `base`. Avoid duplicating the base directory so the built application and dynamic Playground can register the worker in preview.
