# Vite Plugin

Use `mokup/vite` as the Vite plugin entry.

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

| Option       | Type        | Description                           |
| ------------ | ----------- | ------------------------------------- | ------------------- | --------- | -------------- |
| `dir`        | `string \\  | string[] \\                           | (root) => string \\ | string[]` | Mock directory |
| `prefix`     | `string`    | URL prefix                            |
| `include`    | `RegExp \\  | RegExp[]`                             | Include files       |
| `exclude`    | `RegExp \\  | RegExp[]`                             | Exclude files       |
| `watch`      | `boolean`   | Watch file changes                    |
| `log`        | `boolean`   | Enable logging                        |
| `playground` | `boolean \\ | { path?: string, enabled?: boolean }` | Playground config   |

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
