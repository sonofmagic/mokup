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
- [Node.js dev server](./node-server) — start a standalone server with `dir`.
- [Node.js middleware](./node-middleware) — use Express/Koa/Hono/Fastify with build output.

Playground defaults to `/_mokup` in Vite dev and the Node.js server.
