---
"@mokup/shared": patch
---

Reload native ESM JavaScript and TypeScript entries independently of clock timing, and refresh CommonJS entries accessed through symbolic links using their resolved module identity.

Document that native entry refresh preserves cached helper and shared dependency modules, whose changes may require restarting the native server. Vite dev continues to use its module graph invalidation.
