# mokup

## 1.0.3

### Patch Changes

- 📦 **Dependencies** [`1c1edbb`](https://github.com/sonofmagic/mokup/commit/1c1edbb5761d913f3e3f7659da7f1bf4bb361c02)
  → `@mokup/cli@1.0.1`, `@mokup/server@1.0.3`, `@mokup/playground@0.0.7`

## 1.0.2

### Patch Changes

- 🐛 **Fix Vite dev SW lifecycle script to use a resolved module path for `mokup/sw`.** [`5167c7d`](https://github.com/sonofmagic/mokup/commit/5167c7d4fe9d0ec0148998732681f4e4866af47c) by @sonofmagic
- 📦 Updated 5 dependencies [`9cb5835`](https://github.com/sonofmagic/mokup/commit/9cb58357947e1dbe3ec977de7bb07d58c0a8c5be)

## 1.0.1

### Patch Changes

- 📦 **Dependencies** [`a7b9387`](https://github.com/sonofmagic/mokup/commit/a7b9387b48f949a53cc3274f5a461adfdd123894)
  → `@mokup/playground@0.0.5`, `@mokup/server@1.0.1`, `@mokup/cli@0.3.1`

## 1.0.0

### Major Changes

- 🚀 **Add createFetchServer dev API and remove createNodeServer/createMokupServer/startMokupServer.** [`9365bb7`](https://github.com/sonofmagic/mokup/commit/9365bb7f46a515159961a7a51509872e531ceb31) by @sonofmagic

### Minor Changes

- ✨ **Add a commander-based CLI in @mokup/cli with the new `serve` command, expose the Node dev server from @mokup/server, and have the mokup binary delegate to @mokup/cli.** [`ce04fe9`](https://github.com/sonofmagic/mokup/commit/ce04fe99ce918a3705d2341183adaf84c5d36cd0) by @sonofmagic

### Patch Changes

- 📦 Updated 5 dependencies [`ce04fe9`](https://github.com/sonofmagic/mokup/commit/ce04fe99ce918a3705d2341183adaf84c5d36cd0)

## 0.2.2

### Patch Changes

- 📦 **Dependencies** [`0b33818`](https://github.com/sonofmagic/mokup/commit/0b3381872db9852743902019566632331b3ae63c)
  → `@mokup/playground@0.0.4`

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

- ✨ **Switch mock handlers to Hono Context, rename RouteRule.response to handler, and remove rule-level url/method overrides for TS/JS mocks.** [`0f73eac`](https://github.com/sonofmagic/mokup/commit/0f73eaca4c02c2d29f8ff386a768fe179da932ac) by @sonofmagic

### Patch Changes

- 📦 **Dependencies** [`0f73eac`](https://github.com/sonofmagic/mokup/commit/0f73eaca4c02c2d29f8ff386a768fe179da932ac)
  → `@mokup/runtime@0.1.0`

## 0.0.1

### Patch Changes

- 🐛 **chore: release updated mokup packages** [`5671d4f`](https://github.com/sonofmagic/mokup/commit/5671d4fa0e25b466b2e135ac8ddf985468d9e1dd) by @sonofmagic
- 📦 **Dependencies** [`5671d4f`](https://github.com/sonofmagic/mokup/commit/5671d4fa0e25b466b2e135ac8ddf985468d9e1dd)
  → `@mokup/runtime@0.0.1`, `@mokup/playground@0.0.1`
