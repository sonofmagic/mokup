# Mokup Cross-Runtime Mock Design

## Goals

- Provide a deployable mock server for Node.js and Cloudflare Workers.
- Reuse mock rules from the Vite plugin via a build-time manifest.
- Support static payloads and function handlers (optional).
- Ship templates for Node and Worker deployments.

## Packages

- `packages/runtime`: core matching + response runtime.
- `packages/hono`: Hono adapter for Node/Workers.
- `packages/cli`: build CLI to generate manifest/handlers.
- `apps/mock-node`: Node deployment template.
- `apps/mock-worker`: Workers deployment template.

## Manifest Format

- Each entry contains: `method`, `url`, `status`, `headers`, `delay`, `type`.
- Static payloads embed JSON/string in the manifest.
- Function routes reference a bundled module:
  - `{ type: "function", module: "./mokup-handlers/login.mjs", exportName: "default" }`

## CLI (`mokup build`)

- Scans directories like the Vite plugin.
- Normalizes routes (index mapping, method suffix, url/method override).
- Emits `mokup.manifest.json` and optional handler bundles.
- Flags: `--dir`, `--out`, `--include`, `--exclude`, `--handlers`, `--manifest-url`.

## Runtime Flow

- Runtime loads manifest from:
  - direct object,
  - local file (Node),
  - URL/KV/R2 (Worker) via loader callback.
- Requests normalized to `{ method, path, query, headers, body }`.
- Match by `method + path`. If no match, return "not found".
- Static payloads return immediately with headers/status.
- Function payloads dynamically import handler and execute `(req, res, ctx)`.

## Hono Adapter

- Exposes a Hono-compatible middleware for catch-all routing.
- Maps Hono `Context` to runtime request and returns `Response`.
- Provides `ctx.delay` and JSON helpers via runtime.

## Error Handling

- CLI: invalid JSONC or module errors are warned and skipped.
- Duplicate routes warn; last-write-wins.
- Runtime: handler errors return 500 with minimal error payload.
- Optional `debug` flag enables stack traces.

## Testing

- Unit tests for manifest generation and matching.
- Integration tests for Node Hono with headers/status/delay.
- Worker sample tested via Miniflare.
