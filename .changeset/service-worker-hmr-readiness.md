---
'mokup': patch
'@mokup/core': patch
---

Keep Service Worker mock responses current when route updates arrive during registration or hot-module reconnects. Listen before registration completes, catch up when the worker becomes available, and release hot-update listeners when their module is disposed.
