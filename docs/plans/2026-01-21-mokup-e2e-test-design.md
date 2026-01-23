# Mokup E2E Test Design

## Goals

- Provide end-to-end coverage for Vite dev, Playground UI, CLI build outputs, and server adapters.
- Use a single Playwright runner with multi-project isolation and shared setup.
- Support both local development (reuse running servers) and CI runs (self-managed servers).

## Non-goals

- Replace existing unit or integration tests.
- Add cross-browser coverage beyond Chromium.

## Test Matrix

- ui: `apps/web` Vite dev server loads, key UI panels render, API smoke requests via Playwright request.
- playground: `/__mokup` UI loads, routes list is present, search/filter works, route detail shows response.
- cli: `mokup build` emits `mokup.manifest.*`, `mokup.bundle.*`, and handlers; ESM manifest importable.
- adapters: server middleware coverage (connect/express/koa/fastify/hono/fetch) and worker bundle usage.

## Environment & Services

- Vite dev server (`apps/web`) on a fixed port.
- Node mock server (`apps/mock-node`) for real HTTP adapter checks.
- Worker bundle tested via `createMokupWorker` with local fetch (no wrangler).

## Playwright Structure

- Root config with multi-project `projects` and Chromium-only browser.
- `globalSetup` starts services and builds required artifacts.
- `globalTeardown` stops services and cleans temp updates.
- `tests/e2e/utils` provides process launch, port wait, and polling helpers.

## HMR & File Update

- Update `apps/web/mock/heartbeat.get.json`, re-request endpoint, assert payload change.
- Restore original file content after test completes.

## Scripts

- `pnpm test:e2e` for CI-style run.
- `pnpm test:e2e:ui` for headed or UI mode when debugging.
