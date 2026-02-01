# @mokup/core

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
