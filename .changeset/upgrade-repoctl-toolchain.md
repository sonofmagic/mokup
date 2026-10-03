---
"@mokup/cli": patch
"@mokup/client": patch
"@mokup/core": patch
"mokup": patch
"@mokup/playground": patch
"@mokup/query": patch
"@mokup/runtime": patch
"@mokup/server": patch
"@mokup/shared": patch
---

Update runtime dependencies and the shared build toolchain to current compatible releases, including stable Rolldown and Vite 8 support. Preserve the published packages' Node.js runtime requirement of `^20.19.0 || >=22.12.0`.

Migrate repository tooling and release management to repoctl and pnpm 12 native versioning. Development, builds, and CI use Node.js 24 LTS from 24.15.0; TypeScript remains on its latest compatible release line. Integrate the Hono Node server 2.x WebSocket migration while retaining the published Node.js runtime range.
