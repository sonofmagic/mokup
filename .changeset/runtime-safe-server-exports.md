---
"@mokup/server": patch
"mokup": patch
"@mokup/shared": patch
"@mokup/cli": patch
---

Make @mokup/server default entry runtime-safe, add node/adapter subpath exports,
and unify createFetchServer to accept { entries, playground } only. Shared mock
option types are now centralized for Vite/webpack and server configs.
