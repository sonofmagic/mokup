# Webpack Plugin

Use `mokup/webpack` to integrate Mokup with webpack-dev-server and webpack builds.

## Install

```bash
pnpm add -D mokup
```

## Usage

```js
const { createMokupWebpackPlugin } = require('mokup/webpack')

module.exports = {
  plugins: [
    createMokupWebpackPlugin({
      dir: 'mock',
      prefix: '/api',
    }),
  ],
  devServer: {
    setupMiddlewares: middlewares => middlewares,
  },
}
```

## Service Worker mode

```js
const { createMokupWebpackPlugin } = require('mokup/webpack')

module.exports = {
  plugins: [
    createMokupWebpackPlugin({
      dir: 'mock',
      prefix: '/api',
      mode: 'sw',
      sw: {
        path: '/mokup-sw.js',
        scope: '/',
      },
    }),
  ],
}
```

## Options

Options match the Vite plugin options. See [Vite Plugin](./vite-plugin) for the full list.

## Notes

- Dev server support uses `devServer.setupMiddlewares`; ensure `webpack-dev-server` is enabled.
- The SW lifecycle script is emitted under your assets directory (default `assets/mokup-sw-lifecycle.js`). With `html-webpack-plugin` it is auto-injected; otherwise include it manually.
