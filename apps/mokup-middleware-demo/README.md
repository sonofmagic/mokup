# Middleware Demo

An Express example that uses Mokup middleware directly with a built manifest bundle.

## Scripts

```bash
pnpm --filter mokup-middleware-demo dev
pnpm --filter mokup-middleware-demo build:mock
pnpm --filter mokup-middleware-demo typecheck
```

## Verify

- App page: http://localhost:3000
- Express health: http://localhost:3000/health
- Mokup route: http://localhost:3000/api/users

## Notes

- `build:mock` generates `.mokup/mokup.bundle.mjs`, which is loaded by `src/index.ts`.
- Mokup middleware is mounted at `/api` via `createExpressMiddleware`.
