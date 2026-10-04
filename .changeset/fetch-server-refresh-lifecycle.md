---
'@mokup/server': patch
---

Serialize and coalesce fetch server route refreshes so a slow earlier scan cannot overwrite newer routes. Publish route metadata and the Hono app together only after a successful build. Closing file watchers cancels pending background refreshes and waits for started scans to settle, while explicit refreshes remain available afterward.
