# Vite Plugin

Use `mokup/vite` as the Vite plugin entry.

## Install

```bash
pnpm add -D mokup
```

## Usage

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

## Options

### Plugin options

| Option       | Type                                             | Description                         |
| ------------ | ------------------------------------------------ | ----------------------------------- |
| `entries`    | `VitePluginOptions / VitePluginOptions[]`        | Mock entry configs                  |
| `playground` | `boolean / { path?: string; enabled?: boolean }` | Playground config                   |
| `runtime`    | `'vite' / 'worker'`                              | Dev runtime target (default `vite`) |

### Entry options

| Option         | Type                                                                                                                            | Description                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `dir`          | `string / string[] / (root) => string / string[]`                                                                               | Mock directory                             |
| `prefix`       | `string`                                                                                                                        | URL prefix                                 |
| `include`      | `RegExp / RegExp[]`                                                                                                             | Include files                              |
| `exclude`      | `RegExp / RegExp[]`                                                                                                             | Exclude files                              |
| `ignorePrefix` | `string / string[]`                                                                                                             | Ignore path segment prefixes (default `.`) |
| `watch`        | `boolean`                                                                                                                       | Watch file changes                         |
| `log`          | `boolean`                                                                                                                       | Enable logging                             |
| `mode`         | `'server' / 'sw'`                                                                                                               | Mock runtime mode                          |
| `sw`           | `{ path?: string; scope?: string; register?: boolean; unregister?: boolean; fallback?: boolean; basePath?: string / string[] }` | Service worker options (SW mode only)      |

Use `runtime: 'worker'` to skip Vite dev middleware and let a Worker handle
mock requests instead:

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

## Routing notes

- `index` files collapse to the directory root; use `mock/api/index/index.get.ts` for `/api/index`.
- Any directory or file segment starting with `ignorePrefix` is ignored (default `.`).
- `index.config.ts` can override `headers/status/delay/enabled/ignorePrefix/include/exclude` and add directory middleware.
- TS/JS mocks can disable a single route with `enabled: false`.

## Directory config

Use `index.config.ts` in any directory to customize matching and defaults:

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

Configs cascade from root to leaf. Headers merge, and middleware chains are appended in order.

## Service Worker mode

Set `mode: 'sw'` to generate a service worker that runs mock handlers in the browser. The plugin serves the SW in dev/preview and emits it during build at `sw.path` (default `/mokup-sw.js`, scope defaults to `/`). Registration is injected automatically unless `sw.register` is `false`.

### Basic

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

### Custom path/scope + manual registration

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

### Mixed entries

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

Notes:

- `sw.fallback` defaults to `true`. Set it to `false` to disable server middleware for that entry.
- `sw.basePath` controls which requests the SW intercepts. If omitted, it inherits the entry `prefix`. Empty prefixes mean the SW can intercept any path.
- If multiple entries use SW mode, the first `sw.path`/`sw.scope`/`sw.register`/`sw.unregister` wins; conflicting values are ignored with a warning.

### Intercept scope

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

### Unregister

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

Notes:

- `sw.unregister: true` injects an uninstall script and skips registration.
- If there are no SW entries, the plugin auto-injects an uninstall script using the configured `sw.path`/`sw.scope` (or defaults) to clean stale registrations.

## Multi-dir

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
