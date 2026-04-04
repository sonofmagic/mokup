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

```ts
import { mokupWebpack } from 'mokup/webpack'

const withMokup = mokupWebpack({
  entries: {
    dir: 'mock',
    prefix: '/api',
  },
})

export default withMokup({})
```

推荐使用 `webpack.config.ts` 或 `webpack.config.mjs`。Mokup 已发布包不再支持 CommonJS `require()`。

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
