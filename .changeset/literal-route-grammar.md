---
"@mokup/shared": patch
"@mokup/runtime": patch
"@mokup/core": patch
"@mokup/server": patch
"mokup": patch
---

Preserve Mokup route grammar when registering Hono routes. Numeric, hyphenated, and repeated parameter names no longer break routing, and static colons, wildcards, braces, and pipes match literally. Keep original parameter names available to middleware, mounted apps, and error handlers.
