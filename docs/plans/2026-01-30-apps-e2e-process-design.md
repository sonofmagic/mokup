# Apps E2E Process Design

## Goals

- Provide comprehensive end-to-end coverage for every app under `apps/`.
- Keep tests close to each app while still runnable from the repo root via Turbo.
- Use Playwright for all web and HTTP flows with Chromium-only coverage.
- Support dynamic ports and local dev servers (no build + preview for e2e).

## Non-goals

- Replace unit or integration tests already handled by Vitest.
- Add browser matrix coverage beyond Chromium.
- Require external cloud services (wrangler/D1) for local e2e runs.

## Architecture

- Each app owns its e2e tests at `apps/<app>/test/e2e/*.spec.ts`.
- Each app provides a lightweight `playwright.config.ts` that reads `E2E_BASE_URL`.
- A root runner script starts the app dev server on an available port, waits for readiness,
  runs Playwright, and shuts down the server.
- Root `pnpm test:e2e` runs `turbo run test:e2e --filter=./apps/*`.

## Runner Responsibilities

- Resolve app configuration (dev command, health check path, server type).
- Choose an available port and inject it into dev command and `E2E_BASE_URL`.
- Poll the app URL until ready, then invoke Playwright.
- Ensure process cleanup with SIGTERM/SIGKILL on exit or failure.

## App Test Matrix

- mokup-web-demo
  - Navigate Overview -> Playground.
  - Trigger 2+ API cards and assert status + response content.
  - HMR file update test for `/api/heartbeat`.
- mokup-vite-server-demo
  - Run profile/user/login/upload flows via UI.
  - Assert response panel + status.
  - Verify endpoint catalog renders.
- mokup-vite-sw-demo
  - Assert SW status text is not "not supported".
  - Trigger ping/echo/upload and assert output contains expected fields.
- mokup-vite-host-sw-demo
  - Assert host SW + bridge status text.
  - Trigger ping/echo and assert output updates.
- mokup-webpack-demo
  - Run all requests and assert 4 cards reach success state.
  - Validate outputs include expected fields.
- mokup-middleware-demo
  - Load page, run all requests, assert outputs update.
- mokup-node-demo
  - Use Playwright request to fetch `/ping` and `/time` and validate JSON payloads.
- mokup-docs
  - Load docs home, navigate to Quick Start.
  - Request a basic mock endpoint if dev middleware is available.
- mokup-d1-demo
  - Validate page renders and form validation errors.
  - Assert user fetch error messaging when D1 binding is missing.
  - Optional full D1 flow gated by env flag in the future.

## Data-testid Strategy

- Add `data-testid` to key actions/outputs where existing text is unstable.
- Prefer minimal additions (buttons, status output, response panels).
- Keep IDs scoped per app to reduce collisions.

## Error Handling

- Fail fast if server startup exceeds timeout.
- Surface last startup error in runner output for debugging.
- Ensure server processes are terminated in all exit paths.

## Open Questions

- Should docs e2e include deeper navigation beyond Quick Start?
- Should D1 demo include a local sqlite fallback for full CRUD tests?
