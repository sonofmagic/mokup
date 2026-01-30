# @mokup/playground

## 0.1.0

### Minor Changes

- ✨ **Miscellaneous improvements** [`436a594`](https://github.com/sonofmagic/mokup/commit/436a594564eeaeb650924b3fd60651824c333d9b) by @sonofmagic
  - add multipart file upload rows in the playground request builder

### Patch Changes

- 🐛 **Add a mode indicator in the playground header to show SW vs server handling.** [`c3fde3e`](https://github.com/sonofmagic/mokup/commit/c3fde3ec2f7dd576f658123267b678b25367aedc) by @sonofmagic

- 🐛 **chore: add type test coverage and scripts across packages** [`c2ff07c`](https://github.com/sonofmagic/mokup/commit/c2ff07c213681edce0e26d93e8b7d9df420b6093) by @sonofmagic
- 📦 **Dependencies** [`c2ff07c`](https://github.com/sonofmagic/mokup/commit/c2ff07c213681edce0e26d93e8b7d9df420b6093)
  → `@mokup/runtime@1.0.7`

## 0.0.15

### Patch Changes

- 🐛 **Normalize base64 decode errors to a stable message.** [`5419fb7`](https://github.com/sonofmagic/mokup/commit/5419fb7bafd892d4557d4a161713c7e6f45a139e) by @sonofmagic

## 0.0.14

### Patch Changes

- 🐛 **Persist the last selected API route in the playground, avoid auto-selecting a new route when it is missing, and handle CRLF query inputs.** [`6f79992`](https://github.com/sonofmagic/mokup/commit/6f79992b957d59c3cd0e46ec0274d09ca57bad34) by @sonofmagic

## 0.0.13

### Patch Changes

- 🐛 **Improve the playground request panel with collapsible config/middleware sections, clearer missing-param guidance, and stronger selection cues in the sidebar.** [`ee04bdf`](https://github.com/sonofmagic/mokup/commit/ee04bdfe4ebeaa01321dd7bb1eb29859431ec27f) by @sonofmagic

## 0.0.12

### Patch Changes

- 🐛 **Refine Vite playground output formatting and share terminal helpers.** [`58727a9`](https://github.com/sonofmagic/mokup/commit/58727a95de71cb8f4a5eae9d2478d599664c843f) by @sonofmagic
  - Fix playground route config impact typing.

## 0.0.11

### Patch Changes

- 🐛 **refactor: replace before/after middleware positions with pre/normal/post, add defineConfig exports, and introduce defineHandler for route file type hints; update playground middleware display to match.** [`74d29de`](https://github.com/sonofmagic/mokup/commit/74d29de5729b62d96d49ef7bac1dc89b64655f50) by @sonofmagic

## 0.0.10

### Patch Changes

- 🐛 **fix: add config/ignored distinctions in playground route lists** [`aba183d`](https://github.com/sonofmagic/mokup/commit/aba183d4a9cda9dd1796a10d70e9db32628a733c) by @sonofmagic

## 0.0.9

### Patch Changes

- 🐛 **Improve playground request UI with param-aware inputs, tabbed request sections, real-time URL preview, and shared UI components.** [`08b7d60`](https://github.com/sonofmagic/mokup/commit/08b7d60b1f4ca32b687e0302db950c0ddbb38a17) by @sonofmagic

- 🐛 **Add selectable request body types (JSON, text, form, multipart, base64) to the playground.** [`63a04dc`](https://github.com/sonofmagic/mokup/commit/63a04dc8245d4df3ce792edb6f227d1de4f02450) by @sonofmagic

- 🐛 **Allow opening disabled routes in VSCode and render disabled route paths in lowercase.** [`06c943f`](https://github.com/sonofmagic/mokup/commit/06c943fa705ad95a43ff112ec6c00517fcf31228) by @sonofmagic

## 0.0.8

### Patch Changes

- 🐛 **Add ignore-prefix support, per-route enable toggles, and a playground view for disabled routes.** [`86ea1db`](https://github.com/sonofmagic/mokup/commit/86ea1dbfc8842bc233b20016133d980df3d072f5) by @sonofmagic

## 0.0.7

### Patch Changes

- 🐛 **Add per-route and total request counts to the playground UI.** [`1c1edbb`](https://github.com/sonofmagic/mokup/commit/1c1edbb5761d913f3e3f7659da7f1bf4bb361c02) by @sonofmagic

## 0.0.6

### Patch Changes

- 🐛 **Add stable data-testid hooks for E2E coverage.** [`9cb5835`](https://github.com/sonofmagic/mokup/commit/9cb58357947e1dbe3ec977de7bb07d58c0a8c5be) by @sonofmagic

## 0.0.5

### Patch Changes

- 🐛 **Wait for the mokup service worker to take control before running playground requests.** [`a7b9387`](https://github.com/sonofmagic/mokup/commit/a7b9387b48f949a53cc3274f5a461adfdd123894) by @sonofmagic

## 0.0.4

### Patch Changes

- 🐛 **Enable docs SW registration via env override, expand playground layout to fill the viewport, add a VS Code open shortcut for routes in dev, consolidate playground colors into theme tokens, and fix SW registration injection for built assets.** [`0b33818`](https://github.com/sonofmagic/mokup/commit/0b3381872db9852743902019566632331b3ae63c) by @sonofmagic

## 0.0.3

### Patch Changes

- 🐛 **Fix playground build by ensuring the runtime dependency resolves in CI.** [`a16fd2c`](https://github.com/sonofmagic/mokup/commit/a16fd2cdc1a6157fe238cb3a853ed90f7b107b3b) by @sonofmagic

## 0.0.2

### Patch Changes

- 🐛 **Improve playground layout density, selection visibility, soften the palette, and fix SW runtime resolution in builds.** [`b9ccc59`](https://github.com/sonofmagic/mokup/commit/b9ccc5955abb916fafa0fb27eddaf78537c350a5) by @sonofmagic

## 0.0.1

### Patch Changes

- 🐛 **chore: release updated mokup packages** [`5671d4f`](https://github.com/sonofmagic/mokup/commit/5671d4fa0e25b466b2e135ac8ddf985468d9e1dd) by @sonofmagic
