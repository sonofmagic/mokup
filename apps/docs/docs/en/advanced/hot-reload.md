# Hot Reload & Debug

Mokup watches mock directories during Vite dev and refreshes routes automatically.

## Enable/disable watch

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      dir: 'mock',
      watch: true,
    }),
  ],
}
```

Set `watch: false` to disable file watching.

## Debug tips

- Playground refreshes on route changes (`mokup:routes-changed`).
- Ensure file names include method suffixes.
- Handler logs appear in Vite dev output.
