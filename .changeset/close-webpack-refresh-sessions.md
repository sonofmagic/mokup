---
"mokup": patch
---

Cancel pending mock refreshes when Webpack watching closes and discard unfinished work from the closed session. Serialize refreshes, publish routes and Service Worker bundles together after successful builds, and restore mock watching when the compiler starts a new watch session. Keep compilation assets and in-flight Service Worker requests tied to their own session snapshots.

Refresh once after filesystem watching is ready so edits made during its initial scan also reach compiled assets.
