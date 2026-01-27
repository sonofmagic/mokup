# Webpack Plugin

Use `mokup/webpack` to integrate Mokup with webpack-dev-server and webpack builds.

## Install

::: code-group

```bash [pnpm]
pnpm add -D mokup
```

```bash [npm]
npm install -D mokup
```

```bash [yarn]
yarn add -D mokup
```

```bash [bun]
bun add -d mokup
```

:::

## Usage

Use cases:

- Add Mokup mocks to webpack-dev-server without changing app code.
- Emit SW assets during webpack builds for browser-level mocking.

Demo:

```js
const { createMokupWebpackPlugin } = require('mokup/webpack')

module.exports = {
  plugins: [
    createMokupWebpackPlugin({
      entries: {
        dir: 'mock',
        prefix: '/api',
      },
    }),
  ],
  devServer: {
    setupMiddlewares: middlewares => middlewares,
  },
}
```

## Service Worker mode

Use cases:

- Run mock handlers in a browser Service Worker during webpack builds.
- Share the same mock directory between dev-server and SW.

Demo:

```js
const { createMokupWebpackPlugin } = require('mokup/webpack')

module.exports = {
  plugins: [
    createMokupWebpackPlugin({
      entries: {
        dir: 'mock',
        prefix: '/api',
        mode: 'sw',
        sw: {
          path: '/mokup-sw.js',
          scope: '/',
        },
      },
    }),
  ],
}
```

## Options

Options match the Vite plugin: top-level `entries` + `playground`, plus entry options for each item. See [Vite Plugin](./vite-plugin) for the full list.

## Notes

- Dev server support uses `devServer.setupMiddlewares`; ensure `webpack-dev-server` is enabled.
- The SW lifecycle script is emitted under your assets directory (default `assets/mokup-sw-lifecycle.js`). With `html-webpack-plugin` it is auto-injected; otherwise include it manually.
