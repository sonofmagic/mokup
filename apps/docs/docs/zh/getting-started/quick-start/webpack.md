# Webpack 快速开始

## 1. 安装

```bash
pnpm add -D mokup
```

## 2. 添加插件

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

## 3. 启动开发服务

启动 webpack dev server（例如 `pnpm webpack serve`）。

## 4. 验证

- `http://localhost:8080/api/users`
- `http://localhost:8080/_mokup`

## 下一步

完整选项请参考 [Webpack 插件](/zh/reference/webpack-plugin)。
