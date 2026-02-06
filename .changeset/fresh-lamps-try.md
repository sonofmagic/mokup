---
"@mokup/core": patch
"@mokup/playground": patch
"mokup": patch
---

Fix playground SW hot reload for JSON mocks by forcing service worker update on route changes and sending requests with `cache: 'no-store'`.

Add docs E2E coverage for `mock/example-auth/session.get.json` hot reload, including service worker control checks.
