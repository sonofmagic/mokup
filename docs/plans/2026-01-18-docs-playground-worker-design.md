# Docs Playground Worker Design

## Goals

- Deploy the docs site and the Mokup Playground UI from a single Cloudflare Worker.
- Serve mock APIs under `/api` using Mokup manifests generated from `apps/docs/mock`.
- Keep the Playground UI working at `/playground` with route metadata at `/playground/routes`.

## Non-goals

- No separate Worker or separate domain for the Playground.
- No custom UI embedding inside VitePress pages.

## Architecture

- Build VitePress output into `apps/docs/docs/.vitepress/dist`.
- Copy `@mokup/playground/dist` into `apps/docs/docs/.vitepress/dist/playground`.
- Generate mock manifest into `apps/docs/worker/src/.mokup` with prefix `/api`.
- Worker entry routes:
  - `/api/*` -> Mokup fetch handler (`@mokup/server`), 404 if no match.
  - `/playground/routes` -> JSON payload derived from the manifest.
  - `/playground` -> static `/playground/index.html`.
  - everything else -> static assets from VitePress output.
- Assets served through Wrangler `assets` binding.

## Data Flow

- `mokup build --dir mock --out worker/src/.mokup --prefix /api` writes:
  - `mokup.manifest.json` + `mokup.manifest.mjs`
  - bundled handlers at `mokup-handlers`
  - `mokup.bundle.mjs` used by the Worker
- Worker uses the bundle to build the playground route list:
  - `file` uses `route.source` when available
  - `type` uses the response kind (`module` vs static)
  - `middlewares` uses `route.middleware?.map(entry => entry.module)`

## Mock Data

- Seed `apps/docs/mock` with JSON/JSONC, handler routes, and a `index.config.ts`
  that adds headers, delay, and middleware to show Playground capabilities.

## Error Handling

- If `/api/*` has no match, return 404.
- If static asset lookup misses:
  - fallback to `/playground/index.html` for playground routes
  - fallback to `/index.html` for docs routes

## Testing

- Manual: `pnpm -C apps/docs worker:dev`, visit `/`, `/playground`, `/api/ping`.
- Verify playground lists routes and shows middleware chips.
