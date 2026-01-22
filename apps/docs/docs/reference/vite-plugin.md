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
      dir: 'mock',
      prefix: '/api',
    }),
  ],
}
```

## Options

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
| `playground`   | `boolean / { path?: string; enabled?: boolean }`                                                                                | Playground config                          |

## Routing notes

- `index` files collapse to the directory root; use `mock/api/index/index.get.ts` for `/api/index`.
- Any directory or file segment starting with `ignorePrefix` is ignored (default `.`).
- `index.config.ts` can override `ignorePrefix/include/exclude` per directory.
- TS/JS mocks can disable a single route with `enabled: false`.

## Service Worker mode

Set `mode: 'sw'` to generate a service worker that runs mock handlers in the browser. The plugin serves the SW in dev/preview and emits it during build at `sw.path` (default `/mokup-sw.js`, scope defaults to `/`). Registration is injected automatically unless `sw.register` is `false`.

### Basic

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

### Custom path/scope + manual registration

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

### Mixed entries

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

Notes:

- `sw.fallback` defaults to `true`. Set it to `false` to disable server middleware for that entry.
- `sw.basePath` controls which requests the SW intercepts. If omitted, it inherits the entry `prefix`. Empty prefixes mean the SW can intercept any path.
- If multiple entries use SW mode, the first `sw.path`/`sw.scope`/`sw.register`/`sw.unregister` wins; conflicting values are ignored with a warning.

### Intercept scope

```ts
export default {
  plugins: [
    mokup({
      dir: 'mock',
      prefix: '/api',
      mode: 'sw',
      sw: {
        basePath: '/api',
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
      dir: 'mock',
      prefix: '/api',
      mode: 'sw',
      sw: {
        unregister: true,
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
    mokup([
      { dir: 'mock', prefix: '/api' },
      { dir: 'mock-extra', prefix: '/api-extra' },
    ]),
  ],
}
```
