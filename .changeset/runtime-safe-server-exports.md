---
"@mokup/server": patch
"mokup": patch
"@mokup/shared": patch
"@mokup/cli": patch
---

Make @mokup/server default entry runtime-safe, add node/adapter subpath exports,
and update mokup/server to re-export the Node adapters with a new
`mokup/server/fetch` entry for runtime-agnostic handlers. Unify createFetchServer
to accept { entries, playground } only. Shared mock option types are now
centralized for Vite/webpack and server configs.
