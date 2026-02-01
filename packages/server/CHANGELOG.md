# @mokup/server

## 1.2.2

### Patch Changes

- 🐛 **Fix ESM type resolution for subpath exports and add a Node moduleResolution fallback.** [`66f1612`](https://github.com/sonofmagic/mokup/commit/66f161228064fb525242f37512842353bd22980d) by @sonofmagic
- 📦 **Dependencies** [`66f1612`](https://github.com/sonofmagic/mokup/commit/66f161228064fb525242f37512842353bd22980d)
  → `@mokup/runtime@1.0.8`, `@mokup/shared@1.1.3`, `@mokup/playground@0.1.1`

## 1.2.1

### Patch Changes

- 🐛 **chore: add type test coverage and scripts across packages** [`c2ff07c`](https://github.com/sonofmagic/mokup/commit/c2ff07c213681edce0e26d93e8b7d9df420b6093) by @sonofmagic
- 📦 **Dependencies** [`c3fde3e`](https://github.com/sonofmagic/mokup/commit/c3fde3ec2f7dd576f658123267b678b25367aedc)
  → `@mokup/playground@0.1.0`, `@mokup/runtime@1.0.7`, `@mokup/shared@1.1.2`

## 1.2.0

### Minor Changes

- ✨ **feat: replace defineConfig pre/normal/post with onBeforeAll/onAfterAll hooks and app.use; support async config hooks and hookError policy; add mokupWebpack wrapper and createWebpackPlugin alias for webpack** [`f93b392`](https://github.com/sonofmagic/mokup/commit/f93b3927cd3d86b0cfa9758c0d92523df7bedadc) by @sonofmagic

## 1.1.8

### Patch Changes

- 📦 **Dependencies** [`5419fb7`](https://github.com/sonofmagic/mokup/commit/5419fb7bafd892d4557d4a161713c7e6f45a139e)
  → `@mokup/playground@0.0.15`

## 1.1.7

### Patch Changes

- 🐛 **Improve Windows path normalization, module base URL handling, and add cross-platform tests.** [`0477112`](https://github.com/sonofmagic/mokup/commit/047711228c3b831a5418c14418087b5cf7e86c6b) by @sonofmagic
- 📦 **Dependencies** [`33ac588`](https://github.com/sonofmagic/mokup/commit/33ac5886d93789087ff53d3da8cf721ee1e2707b)
  → `@mokup/shared@1.1.1`, `@mokup/playground@0.0.14`, `@mokup/runtime@1.0.6`

## 1.1.6

### Patch Changes

- 🐛 **Allow explicit undefined for worker bundle module fields to satisfy exactOptionalPropertyTypes.** [`449e097`](https://github.com/sonofmagic/mokup/commit/449e09742e3a27b021af700d720441e9424fccd2) by @sonofmagic
- 📦 **Dependencies** [`449e097`](https://github.com/sonofmagic/mokup/commit/449e09742e3a27b021af700d720441e9424fccd2)
  → `@mokup/runtime@1.0.5`, `@mokup/playground@0.0.13`

## 1.1.5

### Patch Changes

- 📦 **Dependencies** [`bb0a019`](https://github.com/sonofmagic/mokup/commit/bb0a019d1e9b09ebbde754b2cbf914cca9364f13)
  → `@mokup/shared@1.1.0`, `@mokup/playground@0.0.13`, `@mokup/runtime@1.0.4`

## 1.1.4

### Patch Changes

- 📦 **Dependencies** [`58727a9`](https://github.com/sonofmagic/mokup/commit/58727a95de71cb8f4a5eae9d2478d599664c843f)
  → `@mokup/playground@0.0.12`

## 1.1.3

### Patch Changes

- 🐛 **refactor: replace before/after middleware positions with pre/normal/post, add defineConfig exports, and introduce defineHandler for route file type hints; update playground middleware display to match.** [`74d29de`](https://github.com/sonofmagic/mokup/commit/74d29de5729b62d96d49ef7bac1dc89b64655f50) by @sonofmagic

- 🐛 **Move consola-backed logger utilities into @mokup/shared and use them across runtime and CLI output.** [`9701b83`](https://github.com/sonofmagic/mokup/commit/9701b838e19e50d46142bcae5ba6fe2aef39bc8b) by @sonofmagic
- 📦 **Dependencies** [`74d29de`](https://github.com/sonofmagic/mokup/commit/74d29de5729b62d96d49ef7bac1dc89b64655f50)
  → `@mokup/playground@0.0.11`, `@mokup/shared@1.0.2`, `@mokup/runtime@1.0.3`

## 1.1.2

### Patch Changes

- 🐛 **Make @mokup/server default entry runtime-safe, add node/adapter subpath exports,** [`fd1e240`](https://github.com/sonofmagic/mokup/commit/fd1e240c9d818c20e87954ca3c4a0d40715f07d2) by @sonofmagic
  - and update mokup/server to re-export the Node adapters with a new `mokup/server/fetch` entry for runtime-agnostic handlers. Unify createFetchServer to accept { entries, playground } only. Shared mock option types are now centralized for Vite/webpack and server configs.
- 📦 **Dependencies** [`fd1e240`](https://github.com/sonofmagic/mokup/commit/fd1e240c9d818c20e87954ca3c4a0d40715f07d2)
  → `@mokup/shared@1.0.1`, `@mokup/runtime@1.0.2`, `@mokup/playground@0.0.10`

## 1.1.1

### Patch Changes

- 🐛 **fix: add config/ignored distinctions in playground route lists** [`aba183d`](https://github.com/sonofmagic/mokup/commit/aba183d4a9cda9dd1796a10d70e9db32628a733c) by @sonofmagic

- 🐛 **fix: preserve contextual typing for RouteRule handler functions** [`d00d9a8`](https://github.com/sonofmagic/mokup/commit/d00d9a8cf095372c7e10631db34266e9f1e32ae3) by @sonofmagic
- 📦 **Dependencies** [`aba183d`](https://github.com/sonofmagic/mokup/commit/aba183d4a9cda9dd1796a10d70e9db32628a733c)
  → `@mokup/playground@0.0.10`, `@mokup/runtime@1.0.1`

## 1.1.0

### Minor Changes

- ✨ **feat: register tsx loader to allow TS mock source debugging by default** [`dd601f9`](https://github.com/sonofmagic/mokup/commit/dd601f990a6546bde5a909cf67990dbbc99fdfa4) by @sonofmagic

### Patch Changes

- 📦 **Dependencies** [`08b7d60`](https://github.com/sonofmagic/mokup/commit/08b7d60b1f4ca32b687e0302db950c0ddbb38a17)
  → `@mokup/playground@0.0.9`

## 1.0.4

### Patch Changes

- 🐛 **Add ignore-prefix support, per-route enable toggles, and a playground view for disabled routes.** [`86ea1db`](https://github.com/sonofmagic/mokup/commit/86ea1dbfc8842bc233b20016133d980df3d072f5) by @sonofmagic
- 📦 **Dependencies** [`86ea1db`](https://github.com/sonofmagic/mokup/commit/86ea1dbfc8842bc233b20016133d980df3d072f5)
  → `@mokup/playground@0.0.8`

## 1.0.3

### Patch Changes

- 🐛 **Fix playground redirect handling to avoid redirect loops.** [`182912b`](https://github.com/sonofmagic/mokup/commit/182912bf450a6ea93c93a3ca776d145bd788b5fc) by @sonofmagic

- 🐛 **Add a playground WebSocket endpoint for server-side request counts and expose the Node serve helper.** [`1c1edbb`](https://github.com/sonofmagic/mokup/commit/1c1edbb5761d913f3e3f7659da7f1bf4bb361c02) by @sonofmagic
- 📦 **Dependencies** [`1c1edbb`](https://github.com/sonofmagic/mokup/commit/1c1edbb5761d913f3e3f7659da7f1bf4bb361c02)
  → `@mokup/playground@0.0.7`

## 1.0.2

### Patch Changes

- 📦 **Dependencies** [`9cb5835`](https://github.com/sonofmagic/mokup/commit/9cb58357947e1dbe3ec977de7bb07d58c0a8c5be)
  → `@mokup/playground@0.0.6`, `@mokup/runtime@1.0.0`, `@mokup/shared@1.0.0`

## 1.0.1

### Patch Changes

- 📦 **Dependencies** [`a7b9387`](https://github.com/sonofmagic/mokup/commit/a7b9387b48f949a53cc3274f5a461adfdd123894)
  → `@mokup/playground@0.0.5`

## 1.0.0

### Major Changes

- 🚀 **Add createFetchServer dev API and remove createNodeServer/createMokupServer/startMokupServer.** [`9365bb7`](https://github.com/sonofmagic/mokup/commit/9365bb7f46a515159961a7a51509872e531ceb31) by @sonofmagic

### Minor Changes

- ✨ **Add a commander-based CLI in @mokup/cli with the new `serve` command, expose the Node dev server from @mokup/server, and have the mokup binary delegate to @mokup/cli.** [`ce04fe9`](https://github.com/sonofmagic/mokup/commit/ce04fe99ce918a3705d2341183adaf84c5d36cd0) by @sonofmagic

### Patch Changes

- 📦 **Dependencies** [`90434e9`](https://github.com/sonofmagic/mokup/commit/90434e978bdab07467e5596c1f4a7567a4cb6c8c)
  → `@mokup/shared@0.1.0`, `@mokup/runtime@0.1.1`, `@mokup/playground@0.0.4`

## 0.0.2

### Patch Changes

- 📦 **Dependencies** [`0f73eac`](https://github.com/sonofmagic/mokup/commit/0f73eaca4c02c2d29f8ff386a768fe179da932ac)
  → `@mokup/runtime@0.1.0`

## 0.0.1

### Patch Changes

- 🐛 **chore: release updated mokup packages** [`5671d4f`](https://github.com/sonofmagic/mokup/commit/5671d4fa0e25b466b2e135ac8ddf985468d9e1dd) by @sonofmagic
- 📦 **Dependencies** [`5671d4f`](https://github.com/sonofmagic/mokup/commit/5671d4fa0e25b466b2e135ac8ddf985468d9e1dd)
  → `@mokup/runtime@0.0.1`
