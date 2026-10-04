---
'@mokup/core': patch
'@mokup/server': patch
'@mokup/playground': patch
---

Match Playground mounts at complete path segments so neighboring application routes are not served as Playground assets. Preserve base aliases, correctly apply bases whose names only prefix a path segment, and serve the index, route list, and assets when Playground is mounted at `/`.

Keep mock routes reachable alongside a root-mounted Playground and register its WebSocket metrics endpoint at `/ws`.

Preserve `/` as the initialized root mount in the Playground UI so explicitly enabled WebSocket metrics connect to `/ws`, while route requests continue to use `/routes`.
