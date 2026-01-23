# @mokup/cli

## 1.0.4

### Patch Changes

- 📦 **Dependencies** [`aba183d`](https://github.com/sonofmagic/mokup/commit/aba183d4a9cda9dd1796a10d70e9db32628a733c)
  → `@mokup/server@1.1.1`, `@mokup/runtime@1.0.1`

## 1.0.3

### Patch Changes

- 📦 **Dependencies** [`dd601f9`](https://github.com/sonofmagic/mokup/commit/dd601f990a6546bde5a909cf67990dbbc99fdfa4)
  → `@mokup/server@1.1.0`

## 1.0.2

### Patch Changes

- 🐛 **Add ignore-prefix support, per-route enable toggles, and a playground view for disabled routes.** [`86ea1db`](https://github.com/sonofmagic/mokup/commit/86ea1dbfc8842bc233b20016133d980df3d072f5) by @sonofmagic
- 📦 **Dependencies** [`86ea1db`](https://github.com/sonofmagic/mokup/commit/86ea1dbfc8842bc233b20016133d980df3d072f5)
  → `@mokup/server@1.0.4`

## 1.0.1

### Patch Changes

- 🐛 **Use the Node server helper from @mokup/server/node.** [`1c1edbb`](https://github.com/sonofmagic/mokup/commit/1c1edbb5761d913f3e3f7659da7f1bf4bb361c02) by @sonofmagic
- 📦 **Dependencies** [`182912b`](https://github.com/sonofmagic/mokup/commit/182912bf450a6ea93c93a3ca776d145bd788b5fc)
  → `@mokup/server@1.0.3`

## 1.0.0

### Major Changes

- 🚀 **Rename public mock APIs to HTTP-oriented types and re-export Hono context/middleware names.** [`6b39338`](https://github.com/sonofmagic/mokup/commit/6b39338d0ca8dab02a5d18cc58f174861726f273) by @sonofmagic

### Patch Changes

- 📦 **Dependencies** [`6b39338`](https://github.com/sonofmagic/mokup/commit/6b39338d0ca8dab02a5d18cc58f174861726f273)
  → `@mokup/runtime@1.0.0`, `@mokup/shared@1.0.0`, `@mokup/server@1.0.2`

## 0.3.1

### Patch Changes

- 📦 **Dependencies**
  → `@mokup/server@1.0.1`

## 0.3.0

### Minor Changes

- ✨ **Add a commander-based CLI in @mokup/cli with the new `serve` command, expose the Node dev server from @mokup/server, and have the mokup binary delegate to @mokup/cli.** [`ce04fe9`](https://github.com/sonofmagic/mokup/commit/ce04fe99ce918a3705d2341183adaf84c5d36cd0) by @sonofmagic

### Patch Changes

- 📦 **Dependencies** [`ce04fe9`](https://github.com/sonofmagic/mokup/commit/ce04fe99ce918a3705d2341183adaf84c5d36cd0)
  → `@mokup/server@1.0.0`, `@mokup/shared@0.1.0`, `@mokup/runtime@0.1.1`

## 0.2.0

### Minor Changes

- ✨ **Move the `mokup` CLI binary into `mokup` and keep `@mokup/cli` as API-only.** [`3700230`](https://github.com/sonofmagic/mokup/commit/3700230085f0b17d9022aa3a14fd6f8e558b1e41) by @sonofmagic

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
  → `@mokup/runtime@0.0.1`
