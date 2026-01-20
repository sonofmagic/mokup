# Mokup Webpack Integration Design

## Goals

- Provide a webpack 5 plugin with feature parity to `createMokupPlugin` (Vite).
- Support dev middleware, SW registration/unregister lifecycle, and playground.
- Keep the public API consistent with `MokupViteOptionsInput`.

## Public API

- `createMokupWebpackPlugin(options?: MokupViteOptionsInput): WebpackPluginInstance`
- Export via `packages/mokup/src/webpack/index.ts` and `mokup/webpack` entry.
- No separate config object; reuse `dir`, `prefix`, `mode`, `sw`, `playground`, etc.

## Build Pipeline

- Scan routes using existing Vite utilities (`scanRoutes`, `buildSwScript`).
- Generate two ESM assets:
  - `mokup-sw.js` (service worker) from `buildSwScript`.
  - `mokup-sw-lifecycle.js` (register/unregister) from the SW lifecycle script.
- Bundle each asset with `esbuild` (platform: `browser`, format: `esm`).
- Emit assets via `compilation.emitAsset`.

## HTML Injection

- Integrate with `html-webpack-plugin` to add:
  - `<script type="module" src=".../mokup-sw-lifecycle.js">`
- Respect `output.publicPath` and SW `path`/`scope` resolution.
- If `html-webpack-plugin` is missing, warn once and skip injection.

## Dev Server

- Hook `devServer.setupMiddlewares` to add:
  - playground middleware (`/_mokup`).
  - SW endpoint (served from in-memory build output).
  - mock API middleware (Hono-based) for server routes.
- Watch mock dirs with `chokidar` when `watch !== false`.
- On file changes: rescan routes, rebuild SW assets, and invalidate compilation.

## Error Handling

- Log SW build failures; serve 500 for SW endpoint on error.
- Skip injection when SW is disabled or no SW routes exist.

## Testing Plan

- Unit tests for: SW lifecycle script decisions, path resolution, and asset naming.
- Middleware tests: playground routes response and SW endpoint behavior.
- Webpack smoke test: compile with `html-webpack-plugin`, assert injected tag and emitted assets.
