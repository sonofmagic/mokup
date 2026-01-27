# Cloudflare Worker Hono Example

## Summary

Add a Cloudflare Worker example that combines Mokup with Hono and document the
pattern alongside the existing fetch handler example.

## Goals

- Provide a Hono + Mokup Worker example in the Cloudflare guide.
- Add a matching example file under `apps/web/worker/src`.
- Keep the existing `createMokupWorker` example intact.

## Non-Goals

- Changing build or runtime behavior.
- Adding new APIs to Mokup packages.

## Approach

- Extend `apps/docs/docs/deploy/cloudflare-worker.md` with a Hono example that
  uses `createFetchHandler` and `app.use('*', ...)`.
- Mirror the same snippet in the Chinese doc.
- Add `apps/web/worker/src/hono.ts` as a supplemental example file.

## Testing

- No new tests. Documentation and example-only changes.
