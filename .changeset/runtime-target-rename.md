---
"mokup": patch
"@mokup/core": patch
---

Rename the Vite plugin runtime option to `RuntimeTarget` (`'node' | 'worker'`), change the default to `'node'`, and throw on legacy `runtime: 'vite'`.
