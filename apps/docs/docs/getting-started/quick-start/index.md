# Quick Start

Pick the setup that matches your stack. All flows share the same mock files.

## 1. Create a mock file

Create `mock/users.get.json`:

```json
{
  "id": 1,
  "name": "Ada"
}
```

## 2. Choose a path

- [Vite plugin](./vite) — recommended for Vite dev and preview.
- [Webpack plugin](./webpack) — integrates with webpack-dev-server.
- [Hono adapter](/reference/server#hono) — run mocks in any Hono runtime.
- [Cloudflare Worker](/deploy/cloudflare-worker) — deploy with the Worker entry.

Playground defaults to `/_mokup` in Vite dev.
