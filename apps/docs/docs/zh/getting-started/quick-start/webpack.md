# Webpack 快速开始

## 1. 安装

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

## 2. 添加插件

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

## 3. 启动开发服务

启动 webpack dev server：

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

## 4. 验证

- `http://localhost:8080/api/users`
- `http://localhost:8080/__mokup`

## 下一步

完整选项请参考 [Webpack 插件](/zh/reference/webpack-plugin)。
