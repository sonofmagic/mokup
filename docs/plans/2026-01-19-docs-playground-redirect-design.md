# Docs playground redirect design

## Goal

Make `/__mokup` the canonical playground entry and redirect `/playground` to it,
so the docs site shows the playground at the expected URL.

## Context

The docs worker currently serves the playground from `/playground`, while the
docs configuration and documentation expect `/__mokup`. This mismatch causes
`/__mokup` to fall through and `/playground` to 404 in production.

## Proposed changes

- Serve the playground from `/__mokup` in the docs worker.
- Redirect `/playground` and `/playground/*` to the matching `/__mokup` path,
  preserving query strings.
- Copy the playground build output into `docs/.vitepress/dist/__mokup` so assets
  align with the new base path.
- Update the docs nav link to point at `/__mokup`.

## Expected behavior

- `/__mokup` and `/__mokup/` serve the playground index.
- `/__mokup/routes` returns the playground routes JSON.
- `/playground` and `/playground/*` 302 to `/__mokup` equivalents.

## Testing

- `pnpm --filter docs worker:dev`
- `curl -I https://mokup.icebreaker.top/__mokup`
- `curl -I https://mokup.icebreaker.top/playground`
