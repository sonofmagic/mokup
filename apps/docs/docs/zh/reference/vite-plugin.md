# Vite 插件

Mokup 的 Vite 插件入口为 `mokup/vite`。

## 安装

```bash
pnpm add -D mokup
```

## 基本用法

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      entries: {
        dir: 'mock',
        prefix: '/api',
      },
    }),
  ],
}
```

## 选项

### 插件选项

| 选项         | 类型                                             | 说明                        |
| ------------ | ------------------------------------------------ | --------------------------- |
| `entries`    | `VitePluginOptions / VitePluginOptions[]`        | mock 目录配置               |
| `playground` | `boolean / { path?: string; enabled?: boolean }` | Playground 配置             |
| `runtime`    | `'vite' / 'worker'`                              | 开发运行目标（默认 `vite`） |

### Entry 选项

| 选项           | 类型                                                                                                                            | 说明                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `dir`          | `string / string[] / (root) => string / string[]`                                                                               | mock 目录                         |
| `prefix`       | `string`                                                                                                                        | 路由前缀                          |
| `include`      | `RegExp / RegExp[]`                                                                                                             | 仅包含匹配文件                    |
| `exclude`      | `RegExp / RegExp[]`                                                                                                             | 排除匹配文件                      |
| `ignorePrefix` | `string / string[]`                                                                                                             | 忽略路径段前缀（默认 `.`）        |
| `watch`        | `boolean`                                                                                                                       | 是否监听文件变化                  |
| `log`          | `boolean`                                                                                                                       | 是否输出日志                      |
| `mode`         | `'server' / 'sw'`                                                                                                               | mock 运行模式                     |
| `sw`           | `{ path?: string; scope?: string; register?: boolean; unregister?: boolean; fallback?: boolean; basePath?: string / string[] }` | Service Worker 配置（仅 SW 模式） |

使用 `runtime: 'worker'` 可跳过 Vite dev 中间件，让 Worker 负责 mock 请求：

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      runtime: 'worker',
      entries: { dir: 'mock', prefix: '/api' },
    }),
  ],
}
```

## 路由备注

- `index` 文件会合并为目录根路径；若需要 `/api/index`，请使用 `mock/api/index/index.get.ts`。
- 以 `ignorePrefix` 指定前缀开头的目录或文件会被忽略，默认忽略 `.`。
- `index.config.ts` 可覆盖 `headers/status/delay/enabled/ignorePrefix/include/exclude` 并添加目录中间件。
- TS/JS mock 可通过 `enabled: false` 暂停单个接口。

## 目录配置

在目录内新增 `index.config.ts`，可配置匹配与默认行为：

```ts
import type { RouteDirectoryConfig } from 'mokup'

const config: RouteDirectoryConfig = {
  enabled: true,
  headers: { 'x-mokup-scope': 'api' },
  status: 200,
  delay: 120,
  ignorePrefix: ['.', '_'],
  include: /users/,
  exclude: /skip/,
  middleware: [
    async (c, next) => {
      c.header('x-mokup', 'dir')
      return await next()
    },
  ],
}

export default config
```

配置会从根目录向下合并。headers 会合并，middleware 按顺序追加。

## Service Worker 模式

将 `mode` 设置为 `'sw'` 后，mock 会在浏览器的 Service Worker 中运行。插件会在 dev/preview 提供 SW 脚本，并在 build 时输出到 `sw.path`（默认 `/mokup-sw.js`，scope 默认 `/`）。默认会自动注入注册脚本，若不需要可设置 `sw.register: false`。

### 基本用法

```ts
export default {
  plugins: [
    mokup({
      entries: {
        dir: 'mock',
        prefix: '/api',
        mode: 'sw',
      },
    }),
  ],
}
```

### 自定义 path/scope + 手动注册

```ts
export default {
  plugins: [
    mokup({
      entries: {
        dir: 'mock',
        prefix: '/api',
        mode: 'sw',
        sw: {
          path: '/mokup-sw.js',
          scope: '/',
          register: false,
        },
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
    mokup({
      entries: [
        { dir: 'mock', prefix: '/api', mode: 'sw', sw: { fallback: false } },
        { dir: 'mock-server', prefix: '/internal', mode: 'server' },
      ],
    }),
  ],
}
```

注意：

- `sw.fallback` 默认是 `true`。设为 `false` 表示不再注册 server 中间件。
- `sw.basePath` 用于控制 SW 只拦截哪些路径。如果未设置，会继承对应 entry 的 `prefix`；若 `prefix` 为空，则可能拦截所有路径。
- 多个 SW 配置同时存在时，首个 `sw.path`/`sw.scope`/`sw.register`/`sw.unregister` 生效，其它冲突配置会被忽略并提示告警。

### 拦截范围

```ts
export default {
  plugins: [
    mokup({
      entries: {
        dir: 'mock',
        prefix: '/api',
        mode: 'sw',
        sw: {
          basePath: '/api',
        },
      },
    }),
  ],
}
```

### 卸载

```ts
export default {
  plugins: [
    mokup({
      entries: {
        dir: 'mock',
        prefix: '/api',
        mode: 'sw',
        sw: {
          unregister: true,
        },
      },
    }),
  ],
}
```

```ts
import { unregisterMokupServiceWorker } from 'mokup/sw'

await unregisterMokupServiceWorker({
  path: '/mokup-sw.js',
  scope: '/',
})
```

注意：

- `sw.unregister: true` 会注入卸载脚本并跳过注册。
- 当没有任何 SW entry 时，插件会自动注入卸载脚本，并使用 `sw.path`/`sw.scope`（或默认值）清理旧的注册。

## 多目录

```ts
export default {
  plugins: [
    mokup({
      entries: [
        { dir: 'mock', prefix: '/api' },
        { dir: 'mock-extra', prefix: '/api-extra' },
      ],
    }),
  ],
}
```
