# Docs playground redirect design

## Goal

Make `/_mokup` the canonical playground entry and redirect `/playground` to it,
so the docs site shows the playground at the expected URL.

## Context

The docs worker currently serves the playground from `/playground`, while the
docs configuration and documentation expect `/_mokup`. This mismatch causes
`/_mokup` to fall through and `/playground` to 404 in production.

## Proposed changes

- Serve the playground from `/_mokup` in the docs worker.
- Redirect `/playground` and `/playground/*` to the matching `/_mokup` path,
  preserving query strings.
- Copy the playground build output into `docs/.vitepress/dist/_mokup` so assets
  align with the new base path.
- Update the docs nav link to point at `/_mokup`.

## Expected behavior

- `/_mokup` and `/_mokup/` serve the playground index.
- `/_mokup/routes` returns the playground routes JSON.
- `/playground` and `/playground/*` 302 to `/_mokup` equivalents.

## Testing

- `pnpm --filter docs worker:dev`
- `curl -I https://mokup.icebreaker.top/_mokup`
- `curl -I https://mokup.icebreaker.top/playground`
