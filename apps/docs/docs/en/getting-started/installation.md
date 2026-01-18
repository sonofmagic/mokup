# Installation

## Requirements

- Node.js 20+
- pnpm (recommended)

## Packages

Vite plugin (dev mocks):

```bash
pnpm add -D mokup
```

CLI (generate `.mokup` output):

```bash
pnpm add -D @mokup/cli
```

Server/Worker runtime (deploy or middleware):

```bash
pnpm add @mokup/server @mokup/runtime
```

If you only need Vite dev mocks, `mokup` is enough.
