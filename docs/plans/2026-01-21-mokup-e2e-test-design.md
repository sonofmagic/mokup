# Mokup E2E Test Design

## Goals

- Provide end-to-end coverage for Vite dev, Playground UI, CLI build outputs, and server adapters.
- Use a single Playwright runner with multi-project isolation and shared setup.
- Support both local development (reuse running servers) and CI runs (self-managed servers).

## Non-goals

- Replace existing unit or integration tests.
- Add cross-browser coverage beyond Chromium.

## Test Matrix

- ui: `apps/mokup-web-demo` Vite dev server loads, key UI panels render, API smoke requests via Playwright request.
- playground: `/__mokup` UI loads, routes list is present, search/filter works, route detail shows response.
- cli: `mokup build` emits `mokup.manifest.*`, `mokup.bundle.*`, and handlers; ESM manifest importable.
- adapters: server middleware coverage (connect/express/koa/fastify/hono/fetch) and worker bundle usage.

## Environment & Services

- Vite dev server (`apps/mokup-web-demo`) on a fixed port.
- Node mock server (`apps/mokup-node-demo`) for real HTTP adapter checks.
- Worker bundle tested via `createMokupWorker` with local fetch (no wrangler).

## Playwright Structure

- Root config with multi-project `projects` and Chromium-only browser.
- `globalSetup` starts services and builds required artifacts.
- `globalTeardown` stops services and cleans temp updates.
- `tests/e2e/utils` provides process launch, port wait, and polling helpers.

## HMR & File Update

- Update `apps/mokup-web-demo/mock/heartbeat.get.json`, re-request endpoint, assert payload change.
- Restore original file content after test completes.

## Scripts

- `pnpm test:e2e:root` for root Playwright coverage (`tests/e2e/*.spec.ts`).
- `pnpm test:e2e:apps` for app-owned E2E routed through Turbo.
- `pnpm test:e2e` for CI-style aggregate run (`root` then `apps`).
- `pnpm test:e2e:serial` for serialized aggregate debugging.
- `pnpm test:e2e:ui` for root Playwright UI plus app-owned UI/debug runs.
