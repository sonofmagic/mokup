# Mock Host SW Demo

## Summary

Create a new `apps/mock-host-sw` demo that shows how an existing host Service Worker can load Mokup's SW output in both dev and production. The host SW is generated with `vite-plugin-pwa` (generateSW) and uses a small bridge script to import `/mokup-sw.js` so Mokup routes continue to work without relying on Mokup's auto-registration.

## Goals

- Demonstrate a host SW that imports `/mokup-sw.js` via a bridge script.
- Keep Mokup in SW mode while disabling its auto registration.
- Expose UI controls that show host SW status, script URL, and bridge readiness.

## Non-goals

- Change Mokup's runtime or SW output format.
- Provide a full production PWA caching strategy beyond the demo needs.

## Approach

1. Add `vite-plugin-pwa` to `apps/mock-host-sw` and configure `generateSW` with auto registration.
2. Add `public/mokup-sw-bridge.js` to load `/mokup-sw.js` via dynamic import and post status to clients.
3. Update the demo UI and `src/main.ts` to display host SW and bridge state, plus manual register/update/unregister actions.

## Validation

- Run `pnpm --filter mock-host-sw dev` and confirm a host SW is registered.
- Verify the host SW loads `/mokup-sw.js` and `/api/ping` returns mock data.
- Click the manual SW controls to confirm update/unregister flows work.
