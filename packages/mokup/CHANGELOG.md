# mokup

## 0.2.1

### Patch Changes

- 📦 **Dependencies** [`a16fd2c`](https://github.com/sonofmagic/mokup/commit/a16fd2cdc1a6157fe238cb3a853ed90f7b107b3b)
  → `@mokup/playground@0.0.3`

## 0.2.0

### Minor Changes

- ✨ **Expose CLI and server adapters via `mokup/cli` and `mokup/server` subpath exports.** [`3700230`](https://github.com/sonofmagic/mokup/commit/3700230085f0b17d9022aa3a14fd6f8e558b1e41) by @sonofmagic

- ✨ **Move the `mokup` CLI binary into `mokup` and keep `@mokup/cli` as API-only.** [`3700230`](https://github.com/sonofmagic/mokup/commit/3700230085f0b17d9022aa3a14fd6f8e558b1e41) by @sonofmagic

- ✨ **Add `mokup/runtime` subpath export and switch SW output to import from it.** [`343b253`](https://github.com/sonofmagic/mokup/commit/343b253f498cb1feadd110e71763273abec67eae) by @sonofmagic

### Patch Changes

- 🐛 **Handle base-prefixed playground paths and ensure the playground middleware runs** [`d2841f1`](https://github.com/sonofmagic/mokup/commit/d2841f17eb7ac16c4a17112737a1caccdd09cac7) by @sonofmagic

  - before static fallbacks.

- 🐛 **Add service worker unregister support and auto-cleanup hooks in the Vite plugin.** [`8de0801`](https://github.com/sonofmagic/mokup/commit/8de08015dcf31759c3aab006a1162e0931576ee6) by @sonofmagic
- 📦 **Dependencies** [`3700230`](https://github.com/sonofmagic/mokup/commit/3700230085f0b17d9022aa3a14fd6f8e558b1e41)
  → `@mokup/cli@0.2.0`, `@mokup/playground@0.0.2`

## 0.1.0

### Minor Changes

- ✨ **Switch mock handlers to Hono Context, rename MockRule.response to handler, and remove rule-level url/method overrides for TS/JS mocks.** [`0f73eac`](https://github.com/sonofmagic/mokup/commit/0f73eaca4c02c2d29f8ff386a768fe179da932ac) by @sonofmagic

### Patch Changes

- 📦 **Dependencies** [`0f73eac`](https://github.com/sonofmagic/mokup/commit/0f73eaca4c02c2d29f8ff386a768fe179da932ac)
  → `@mokup/runtime@0.1.0`

## 0.0.1

### Patch Changes

- 🐛 **chore: release updated mokup packages** [`5671d4f`](https://github.com/sonofmagic/mokup/commit/5671d4fa0e25b466b2e135ac8ddf985468d9e1dd) by @sonofmagic
- 📦 **Dependencies** [`5671d4f`](https://github.com/sonofmagic/mokup/commit/5671d4fa0e25b466b2e135ac8ddf985468d9e1dd)
  → `@mokup/runtime@0.0.1`, `@mokup/playground@0.0.1`
