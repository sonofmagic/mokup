# Playground

Playground is a built-in UI for browsing and debugging mock APIs.

## Default entry

```
http://localhost:5173/__mokup
```

## Configure path

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      entries: {
        dir: 'mock',
        prefix: '/api',
      },
      playground: {
        path: '/__mokup',
        enabled: true,
      },
    }),
  ],
}
```

Set `playground: false` to disable it.

## Features

- Grouped route listing
- Request method/path inspection
- Live refresh on file changes
