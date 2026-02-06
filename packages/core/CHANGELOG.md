# @mokup/core

## 1.1.3

### Patch Changes

- 🐛 **Fix playground SW hot reload for JSON mocks by forcing service worker update on route changes and sending requests with `cache: 'no-store'`.** [`6d7601b`](https://github.com/sonofmagic/mokup/commit/6d7601b55663d7b82c9f3a726463fccaea5295a8) by @sonofmagic

  - Add docs E2E coverage for `mock/example-auth/session.get.json` hot reload, including service worker control checks.

- 🐛 **Fix TS mock hot-reload behavior in SW mode by improving Vite module invalidation and SW module refresh versioning.** [`5b21830`](https://github.com/sonofmagic/mokup/commit/5b218301aa7882752145f121a872612d591945ec) by @sonofmagic
- 📦 **Dependencies** [`e97e70d`](https://github.com/sonofmagic/mokup/commit/e97e70df5c8cf67f910b1869ce4cc803a716ec94)
  → `@mokup/shared@1.1.4`, `@mokup/runtime@1.0.9`

## 1.1.2

### Patch Changes

- 🐛 **Rename the Vite plugin runtime option to `RuntimeTarget` (`'node' | 'worker'`), change the default to `'node'`, and throw on legacy `runtime: 'vite'`.** [`19a3fbb`](https://github.com/sonofmagic/mokup/commit/19a3fbbb82a839c197a76ded28f42abf8d024cfc) by @sonofmagic

## 1.1.1

### Patch Changes

- 🐛 **Fix ESM type resolution for subpath exports and add a Node moduleResolution fallback.** [`66f1612`](https://github.com/sonofmagic/mokup/commit/66f161228064fb525242f37512842353bd22980d) by @sonofmagic
- 📦 **Dependencies** [`66f1612`](https://github.com/sonofmagic/mokup/commit/66f161228064fb525242f37512842353bd22980d)
  → `@mokup/runtime@1.0.8`, `@mokup/shared@1.1.3`

## 1.1.0

### Minor Changes

- ✨ **Miscellaneous improvements** [`4001a06`](https://github.com/sonofmagic/mokup/commit/4001a06f6f1a181f7acb6a001d7261d30c1818f1) by @sonofmagic
  - add the new `@mokup/core` package for shared mokup scanning/manifest utilities
  - force worker runtime reloads when mock routes change so restored jsonc mocks respond correctly

### Patch Changes

- 🐛 **chore: add type test coverage and scripts across packages** [`c2ff07c`](https://github.com/sonofmagic/mokup/commit/c2ff07c213681edce0e26d93e8b7d9df420b6093) by @sonofmagic
- 📦 **Dependencies** [`c2ff07c`](https://github.com/sonofmagic/mokup/commit/c2ff07c213681edce0e26d93e8b7d9df420b6093)
  → `@mokup/runtime@1.0.7`, `@mokup/shared@1.1.2`
