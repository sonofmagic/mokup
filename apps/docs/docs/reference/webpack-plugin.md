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

Recommended (with wrapper):

```js
const { mokupWebpack } = require('mokup/webpack')

const withMokup = mokupWebpack({
  entries: {
    dir: 'mock',
    prefix: '/api',
  },
})

module.exports = withMokup({})
```

Direct plugin (short name):

```js
const { createWebpackPlugin } = require('mokup/webpack')

module.exports = {
  plugins: [
    createWebpackPlugin({
      entries: {
        dir: 'mock',
        prefix: '/api',
      },
    }),
  ],
  devServer: {},
}
```

## Service Worker mode

Use cases:

- Run mock handlers in a browser Service Worker during webpack builds.
- Share the same mock directory between dev-server and SW.

Demo:

```js
const { createWebpackPlugin } = require('mokup/webpack')

module.exports = {
  plugins: [
    createWebpackPlugin({
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
- `mokupWebpack(...)` auto-creates a `devServer` object, so you can omit it unless you need custom dev-server settings.
- The SW lifecycle script is emitted under your assets directory (default `assets/mokup-sw-lifecycle.js`). With `html-webpack-plugin` it is auto-injected; otherwise include it manually.
