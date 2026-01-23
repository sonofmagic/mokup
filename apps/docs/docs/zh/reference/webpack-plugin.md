# Webpack 插件

使用 `mokup/webpack` 在 webpack-dev-server 与构建产物中接入 Mokup。

## 安装

```bash
pnpm add -D mokup
```

## 基本用法

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

## Service Worker 模式

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

## 选项

选项与 Vite 插件一致：顶层 `entries` + `playground`，以及每个 entry 的配置，详见 [Vite 插件](./vite-plugin)。

## 注意

- Dev server 会通过 `devServer.setupMiddlewares` 注入中间件，请确保启用了 `webpack-dev-server`。
- SW 生命周期脚本会输出到 assets 目录（默认 `assets/mokup-sw-lifecycle.js`）。如果使用 `html-webpack-plugin` 会自动注入，否则需要手动引入。
