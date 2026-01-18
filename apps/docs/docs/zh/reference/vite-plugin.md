# Vite 插件

Mokup 的 Vite 插件入口为 `mokup/vite`。

## 基本用法

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      dir: 'mock',
      prefix: '/api',
    }),
  ],
}
```

## 选项

| 选项         | 类型        | 说明                                  |
| ------------ | ----------- | ------------------------------------- | ------------------- | --------- | --------- |
| `dir`        | `string \\  | string[] \\                           | (root) => string \\ | string[]` | mock 目录 |
| `prefix`     | `string`    | 路由前缀                              |
| `include`    | `RegExp \\  | RegExp[]`                             | 仅包含匹配文件      |
| `exclude`    | `RegExp \\  | RegExp[]`                             | 排除匹配文件        |
| `watch`      | `boolean`   | 是否监听文件变化                      |
| `log`        | `boolean`   | 是否输出日志                          |
| `playground` | `boolean \\ | { path?: string, enabled?: boolean }` | Playground 配置     |

## 多目录

```ts
export default {
  plugins: [
    mokup([
      { dir: 'mock', prefix: '/api' },
      { dir: 'mock-extra', prefix: '/api-extra' },
    ]),
  ],
}
```
