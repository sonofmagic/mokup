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

| 选项         | 类型                                                                        | 说明                              |
| ------------ | --------------------------------------------------------------------------- | --------------------------------- |
| `dir`        | `string / string[] / (root) => string / string[]`                           | mock 目录                         |
| `prefix`     | `string`                                                                    | 路由前缀                          |
| `include`    | `RegExp / RegExp[]`                                                         | 仅包含匹配文件                    |
| `exclude`    | `RegExp / RegExp[]`                                                         | 排除匹配文件                      |
| `watch`      | `boolean`                                                                   | 是否监听文件变化                  |
| `log`        | `boolean`                                                                   | 是否输出日志                      |
| `mode`       | `'server' / 'sw'`                                                           | mock 运行模式                     |
| `sw`         | `{ path?: string; scope?: string; register?: boolean; fallback?: boolean }` | Service Worker 配置（仅 SW 模式） |
| `playground` | `boolean / { path?: string; enabled?: boolean }`                            | Playground 配置                   |

## Service Worker 模式

将 `mode` 设置为 `'sw'` 后，mock 会在浏览器的 Service Worker 中运行。插件会在 dev/preview 提供 SW 脚本，并在 build 时输出到 `sw.path`（默认 `/mokup-sw.js`，scope 默认 `/`）。默认会自动注入注册脚本，若不需要可设置 `sw.register: false`。

### 基本用法

```ts
export default {
  plugins: [
    mokup({
      dir: 'mock',
      prefix: '/api',
      mode: 'sw',
    }),
  ],
}
```

### 自定义 path/scope + 手动注册

```ts
export default {
  plugins: [
    mokup({
      dir: 'mock',
      prefix: '/api',
      mode: 'sw',
      sw: {
        path: '/mokup-sw.js',
        scope: '/',
        register: false,
      },
    }),
  ],
}
```

```ts
import { registerMokupServiceWorker } from 'mokup/sw'

registerMokupServiceWorker({
  path: '/mokup-sw.js',
  scope: '/',
})
```

### 混合模式

```ts
export default {
  plugins: [
    mokup([
      { dir: 'mock', prefix: '/api', mode: 'sw', sw: { fallback: false } },
      { dir: 'mock-server', prefix: '/internal', mode: 'server' },
    ]),
  ],
}
```

注意：

- `sw.fallback` 默认是 `true`。设为 `false` 表示不再注册 server 中间件。
- 多个 SW 配置同时存在时，首个 `sw.path`/`sw.scope`/`sw.register` 生效，其它冲突配置会被忽略并提示告警。

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
