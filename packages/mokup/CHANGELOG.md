# mokup

## 2.2.1

### Patch Changes

- 🐛 **Add a cross-platform `mokup/bundle` entry that exposes `buildBundleModule`.** [`1176513`](https://github.com/sonofmagic/mokup/commit/11765138c4a83ac68511884ce32125c30fbc6f08) by @sonofmagic

- 🐛 **Allow explicit undefined for worker bundle module fields to satisfy exactOptionalPropertyTypes.** [`449e097`](https://github.com/sonofmagic/mokup/commit/449e09742e3a27b021af700d720441e9424fccd2) by @sonofmagic
- 📦 Updated 4 dependencies [`449e097`](https://github.com/sonofmagic/mokup/commit/449e09742e3a27b021af700d720441e9424fccd2)

## 2.2.0

### Minor Changes

- ✨ **Add build-time playground output to the mokup Vite plugin and expose a playground build flag.** [`bb0a019`](https://github.com/sonofmagic/mokup/commit/bb0a019d1e9b09ebbde754b2cbf914cca9364f13) by @sonofmagic

### Patch Changes

- 📦 Updated 5 dependencies [`bb0a019`](https://github.com/sonofmagic/mokup/commit/bb0a019d1e9b09ebbde754b2cbf914cca9364f13)

## 2.1.1

### Patch Changes

- 🐛 **Refine Vite playground output formatting and share terminal helpers.** [`58727a9`](https://github.com/sonofmagic/mokup/commit/58727a95de71cb8f4a5eae9d2478d599664c843f) by @sonofmagic

  - Fix playground route config impact typing.

- 🐛 **Fix dev service worker logger import resolution for docs.** [`d7f2c14`](https://github.com/sonofmagic/mokup/commit/d7f2c142d8709997bcdaef9539018d036823800c) by @sonofmagic
- 📦 **Dependencies** [`58727a9`](https://github.com/sonofmagic/mokup/commit/58727a95de71cb8f4a5eae9d2478d599664c843f)
  → `@mokup/playground@0.0.12`, `@mokup/server@1.1.4`, `@mokup/cli@1.0.7`

## 2.1.0

### Minor Changes

- ✨ **Add a Vite virtual bundle module for Worker entries so builds no longer need a generated .mokup bundle.** [`69e852c`](https://github.com/sonofmagic/mokup/commit/69e852c2571d35a4def30b5b7b096c4a07adebc2) by @sonofmagic

### Patch Changes

- 🐛 **Ship built-in type declarations for the `virtual:mokup-bundle` module.** [`69e852c`](https://github.com/sonofmagic/mokup/commit/69e852c2571d35a4def30b5b7b096c4a07adebc2) by @sonofmagic

- 🐛 **refactor: replace before/after middleware positions with pre/normal/post, add defineConfig exports, and introduce defineHandler for route file type hints; update playground middleware display to match.** [`74d29de`](https://github.com/sonofmagic/mokup/commit/74d29de5729b62d96d49ef7bac1dc89b64655f50) by @sonofmagic

- 🐛 **Move consola-backed logger utilities into @mokup/shared and use them across runtime and CLI output.** [`9701b83`](https://github.com/sonofmagic/mokup/commit/9701b838e19e50d46142bcae5ba6fe2aef39bc8b) by @sonofmagic

- 🐛 **Colorize the Mokup Playground URL in Vite dev output and place it after Local/Network.** [`a715a4e`](https://github.com/sonofmagic/mokup/commit/a715a4edddaa2ff056aefe8a9ef2c613667e9d20) by @sonofmagic
- 📦 Updated 5 dependencies [`74d29de`](https://github.com/sonofmagic/mokup/commit/74d29de5729b62d96d49ef7bac1dc89b64655f50)

## 2.0.2

### Patch Changes

- 🐛 **Make @mokup/server default entry runtime-safe, add node/adapter subpath exports,** [`fd1e240`](https://github.com/sonofmagic/mokup/commit/fd1e240c9d818c20e87954ca3c4a0d40715f07d2) by @sonofmagic
  - and update mokup/server to re-export the Node adapters with a new `mokup/server/fetch` entry for runtime-agnostic handlers. Unify createFetchServer to accept { entries, playground } only. Shared mock option types are now centralized for Vite/webpack and server configs.
- 📦 Updated 5 dependencies [`fd1e240`](https://github.com/sonofmagic/mokup/commit/fd1e240c9d818c20e87954ca3c4a0d40715f07d2)

## 2.0.1

### Patch Changes

- 🐛 **fix: add config/ignored distinctions in playground route lists** [`aba183d`](https://github.com/sonofmagic/mokup/commit/aba183d4a9cda9dd1796a10d70e9db32628a733c) by @sonofmagic

- 🐛 **fix: preserve contextual typing for RouteRule handler functions** [`d00d9a8`](https://github.com/sonofmagic/mokup/commit/d00d9a8cf095372c7e10631db34266e9f1e32ae3) by @sonofmagic
- 📦 Updated 4 dependencies [`aba183d`](https://github.com/sonofmagic/mokup/commit/aba183d4a9cda9dd1796a10d70e9db32628a733c)

## 2.0.0

### Major Changes

- 🚀 **refactor: move Vite/webpack plugin config to `{ entries, playground }` and drop legacy entry-shaped input** [`006d219`](https://github.com/sonofmagic/mokup/commit/006d219943db21334fb60818e4e29c2ada896996) by @sonofmagic

### Patch Changes

- 🐛 **Handle Vite watcher relative paths and rename events so mock route changes refresh the playground.** [`06c943f`](https://github.com/sonofmagic/mokup/commit/06c943fa705ad95a43ff112ec6c00517fcf31228) by @sonofmagic
- 📦 **Dependencies** [`dd601f9`](https://github.com/sonofmagic/mokup/commit/dd601f990a6546bde5a909cf67990dbbc99fdfa4)
  → `@mokup/server@1.1.0`, `@mokup/playground@0.0.9`, `@mokup/cli@1.0.3`

## 1.0.4

### Patch Changes

- 🐛 **Add ignore-prefix support, per-route enable toggles, and a playground view for disabled routes.** [`86ea1db`](https://github.com/sonofmagic/mokup/commit/86ea1dbfc8842bc233b20016133d980df3d072f5) by @sonofmagic
- 📦 **Dependencies** [`86ea1db`](https://github.com/sonofmagic/mokup/commit/86ea1dbfc8842bc233b20016133d980df3d072f5)
  → `@mokup/cli@1.0.2`, `@mokup/server@1.0.4`, `@mokup/playground@0.0.8`

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
