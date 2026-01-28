# Mock Vite Server Demo

## Summary

Add a new `apps/mock-vite-server` demo app that showcases Mokup's default Vite server runtime with a simple Vue UI and three mock endpoints powered by `@faker-js/faker`. The app demonstrates GET, POST, and dynamic route handling under `/api/*` without service workers.

## Goals

- Provide a minimal Vite + Vue demo that uses Mokup server-mode (default) mocks.
- Showcase three endpoints: `/api/profile`, `/api/users/:id`, and `/api/login`.
- Use `@faker-js/faker` to generate realistic mock payloads on each request.
- Keep setup consistent with existing `apps/*` demos and workspace tooling.

## Non-goals

- Demonstrate SW runtime or worker runtime behavior.
- Add complex UI or state management beyond basic request/response rendering.
- Introduce server-side frameworks outside the Vite dev server.

## Approach

1. Create `apps/mock-vite-server` with Vite + Vue scaffold, matching repo conventions.
2. Configure `vite.config.ts` to use `mokup({ entries: { dir: 'mock', prefix: '/api' } })` and default runtime.
3. Add `mock/` routes:
   - `profile.get.ts` returns a profile object from faker.
   - `users/[id].get.ts` returns a user object with the path param ID and faker data.
   - `login.post.ts` returns a token and user snippet, optionally echoing input.
4. Build `src/App.vue` with three cards (Profile, User by ID, Login) and a shared response panel.
5. Add `@faker-js/faker` and `mokup` to app dependencies.

## Validation

- Run `pnpm --filter mock-vite-server dev` and confirm the UI loads.
- Click each action and verify `/api/*` responses render in the response panel.
- Add a Playwright e2e test that calls the three endpoints and checks for expected keys.
