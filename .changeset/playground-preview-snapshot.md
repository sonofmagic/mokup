---
"@mokup/core": patch
"mokup": patch
---

Resolve Playground build output relative to the Vite project root and avoid duplicating the base prefix on disk. When Playground builds are enabled, preview serves the built HTML, assets, and route snapshot, preserves query parameters when redirecting the mount to its trailing-slash URL, and keeps server mock routes from shadowing that static mount.
