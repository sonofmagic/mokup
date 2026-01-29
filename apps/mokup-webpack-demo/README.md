# Webpack Demo

A Vue + webpack 5 demo that shows Mokup integration in both build mode and webpack-dev-server mode.

## Scripts

```bash
pnpm --filter mokup-webpack-demo dev
pnpm --filter mokup-webpack-demo build
pnpm --filter mokup-webpack-demo typecheck
```

## Verify

- Dev server: http://localhost:8080
- Mock routes: http://localhost:8080/api/health

To preview the build output, serve `dist/` with any static server.

```bash
pnpm --filter mokup-webpack-demo build
pnpm dlx serve apps/mokup-webpack-demo/dist
```

## Notes

- Mock routes live in `mock/` and are mounted under `/api` via the webpack plugin.
- `webpack.config.ts` uses `tsx` to load the TypeScript config.
