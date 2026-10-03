---
'mokup': patch
---

Manage mock route refreshes across Vite shutdown and restart: cancel pending watcher work, drain active scans before closing the module loader, and serialize overlapping refresh requests so newer routes cannot be replaced by older scan results.
