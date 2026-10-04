---
'mokup': patch
---

Publish Vite route refreshes atomically after diagnostics, app construction, and route signature generation succeed. Keep the last successful routes, Playground metadata, app, and Service Worker version when a candidate refresh is rejected, while continuing to record diagnostics. Recover first-route Service Worker registration after rejected scans and expose the complete new snapshot before notifying HMR consumers.
