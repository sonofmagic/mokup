# Vite Build Output

Generate deployable artifacts with the CLI:

```bash
pnpm exec mokup build --dir mock --out .mokup
```

Output structure:

```
.mokup/
  mokup.manifest.json
  mokup.manifest.mjs
  mokup.manifest.d.mts
  mokup.bundle.mjs
  mokup.bundle.d.ts
  mokup.bundle.d.mts
  mokup-handlers/ (optional)
```

`mokup.bundle.mjs` is the easiest entry for Workers or custom runtimes.

## Service Worker build

When you set `mode: 'sw'` in the Vite plugin, the service worker script is emitted during `vite build` (default `/mokup-sw.js`). The plugin also injects a registration snippet unless `sw.register` is `false`.

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      dir: 'mock',
      prefix: '/api',
      mode: 'sw',
      sw: {
        path: '/mokup-sw.js',
        scope: '/',
      },
    }),
  ],
}
```

This is ideal for static hosting because mock requests are handled in the browser. If you also ship the playground, make sure `/_mokup/routes` is available as a static JSON file (generate it during build with `mokup build` or a small script).

Notes:

- `sw.basePath` controls which requests the SW intercepts. If omitted, it inherits the entry `prefix`.
