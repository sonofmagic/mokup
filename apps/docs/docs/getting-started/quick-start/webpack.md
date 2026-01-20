# Webpack Quick Start

## 1. Install

```bash
pnpm add -D mokup
```

## 2. Add the plugin

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

## 3. Start dev server

Run your webpack dev server (for example `pnpm webpack serve`).

## 4. Verify

- `http://localhost:8080/api/users`
- `http://localhost:8080/_mokup`

## Next

See the full options in [Webpack Plugin](/reference/webpack-plugin).
