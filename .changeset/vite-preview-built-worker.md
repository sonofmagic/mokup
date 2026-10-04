---
'mokup': patch
---

Serve the built Service Worker during Vite preview instead of overriding it with unbundled development source. Browser SW registration now works with bundled JSON routes, TypeScript handlers, and middleware under the configured base path, including manual registration. SW mock changes require a rebuild; Node preview route watching remains available.
