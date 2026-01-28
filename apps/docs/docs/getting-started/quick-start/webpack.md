# Webpack Quick Start

## 1. Install

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

## 2. Add the plugin

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

## 3. Start dev server

Run your webpack dev server:

::: code-group

```bash [pnpm]
pnpm webpack serve
```

```bash [npm]
npm exec webpack serve
```

```bash [yarn]
yarn webpack serve
```

```bash [bun]
bunx webpack serve
```

:::

## 4. Verify

- `http://localhost:8080/api/users`
- `http://localhost:8080/__mokup`

## Next

See the full options in [Webpack Plugin](/reference/webpack-plugin).
