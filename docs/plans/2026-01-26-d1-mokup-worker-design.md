# D1 Mokup Worker + Drizzle + Better Auth Design

## Goal

Add a new app at `apps/d1-mokup` that demonstrates Cloudflare Workers + D1 with drizzle-orm and better-auth, while using mokup mock rules for both local development and deployment. The app exposes `/api/users` endpoints and better-auth routes under `/api/auth`, plus a minimal front-end page showing usage.

## Architecture

- Use Vite + `@cloudflare/vite-plugin` to build the worker bundle and static front-end.
- Use `mokup/vite` with `runtime: 'worker'` and `entries: [{ dir: 'mock', prefix: '/api' }]` so mock routes are compiled into `virtual:mokup-bundle` for dev/build and also used in production.
- Worker entry `worker/src/index.ts` creates a runtime Hono app from `createRuntimeApp(mokupBundle)` and forwards requests via `app.fetch(request, env, ctx)` so the Hono context has access to Cloudflare bindings (`c.env`).
- A directory-level middleware in `mock/index.config.ts` creates a drizzle client from `c.env.DB` and sets it on the context (`c.set('db', db)`). It also creates a better-auth instance (D1 adapter + drizzle) and exposes it via `c.set('auth', auth)`.

## Components

- `apps/d1-mokup/worker/src/index.ts`: Worker fetch entry that dispatches to mokup runtime and passes `env`/`ctx`.
- `apps/d1-mokup/mock/index.config.ts`: Middleware registration via `defineConfig` that attaches `db` and `auth` to the context.
- `apps/d1-mokup/mock/users.get.ts`: Query `users` table via drizzle and return JSON list.
- `apps/d1-mokup/mock/users.post.ts`: Validate input, insert into `users`, return created record.
- `apps/d1-mokup/mock/auth/[[...slug]].ts`: Delegate auth routes to better-auth handler for `/api/auth/*`.
- `apps/d1-mokup/db/schema.ts`: Drizzle schema for `users` and better-auth tables.
- `apps/d1-mokup/drizzle.config.ts`: Drizzle-kit config for D1.
- Minimal front-end (`src/`): a simple page that displays users and a login link.

## Data Flow

1. Incoming request hits Worker fetch.
2. Worker calls Hono app built by mokup runtime.
3. Middleware sets `db` and `auth` on context from Cloudflare `env`.
4. Route handler uses `c.get('db')` for users or `c.get('auth')` for auth.
5. Responses are normalized by mokup runtime and returned to the client.

## Error Handling

- If `DB` binding is missing, middleware returns a 500 with a clear message.
- If OAuth secrets are missing, auth handler returns a 500 with setup guidance.
- `/api/users` POST validates required fields and returns 400 on invalid input.
- Query/insert failures return 500 with a concise error payload.

## Configuration

- `wrangler.jsonc` binds D1 (`DB`) and exposes `AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
- App scripts include `db:generate` and `db:push` via drizzle-kit.

## Testing

- Basic runtime sanity check by hitting `/api/users` and `/api/auth/signin` in dev.
- Add a small `test/*.test.ts` for users handler validation if needed.

## Open Questions

- Confirm the exact better-auth Cloudflare adapter API and handler signature for route delegation.
