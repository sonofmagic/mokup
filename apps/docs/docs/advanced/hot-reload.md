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

## Debug mock handlers and middleware

Mock handlers and directory middleware run on the Node side of Vite, so use a
Node debugger rather than browser DevTools.

### VSCode (recommended)

1. Open the Command Palette and run **Debug: Create JavaScript Debug Terminal**.
2. In that terminal, start your dev command (for example `pnpm dev --filter <app>`).
3. Set breakpoints in `mock/**/*.ts` or `mock/**/index.config.ts`.

If you prefer a `launch.json`, use a Node launch config with `pnpm` and enable
source maps and child process attach:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Vite Dev (mock debug)",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["dev", "--filter", "<app>"],
  "cwd": "${workspaceFolder}",
  "env": {
    "NODE_OPTIONS": "--enable-source-maps --inspect"
  },
  "autoAttachChildProcesses": true
}
```

### Terminal + Node Inspector

```bash
NODE_OPTIONS="--inspect-brk --enable-source-maps" pnpm dev --filter <app>
```

Then attach from VSCode ("Attach to Node") or open `chrome://inspect`.

### Quick sanity checks

- Add `debugger;` or `console.log` in the handler to confirm it is being loaded.
- Preview builds may not support Vite dev debugging; use `dev` for breakpoints.
