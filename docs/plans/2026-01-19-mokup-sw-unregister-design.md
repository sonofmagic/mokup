# Mokup SW Unregister Support

## Summary

Add an uninstall pathway for Mokup service workers so users can proactively remove stale registrations. Provide both a manual API (`unregisterMokupServiceWorker`) and a Vite plugin option (`sw.unregister`) that injects an uninstall script. When no SW entries are present, auto-inject an uninstall script to clean up prior registrations.

## Goals

- Add `unregisterMokupServiceWorker` to `mokup/sw` with path/scope matching.
- Support `sw.unregister` in the Vite plugin, with explicit uninstall overriding registration.
- Auto-unregister when there are no SW entries (`mode !== 'sw'` across options).
- Update docs to explain the new option and API.

## Non-goals

- Change runtime matching or manifest generation.
- Add a full UI for SW management.

## Approach

1. Client helper: implement `unregisterMokupServiceWorker({ path, scope })` in `packages/mokup/src/sw.ts`. It uses `navigator.serviceWorker.getRegistrations()` and removes only registrations whose scope matches and whose script URL path equals the configured SW path. Defaults are `/mokup-sw.js` and `/`. Returns the successfully unregistered registrations and handles non-browser contexts gracefully.

2. Vite plugin: extend `ServiceWorkerOptions` with `unregister?: boolean`. If `sw.unregister` is `true`, inject an uninstall script and skip registration. When no SW entries exist, inject an uninstall script using configured `sw.path`/`sw.scope` (or defaults). Registration behavior remains unchanged otherwise.

3. Docs: update the Vite plugin reference in English/Chinese to include `sw.unregister`, the uninstall behavior, and the manual helper API.

## Validation

- Update unit tests for SW config resolution defaults and conflicts.
- Smoke test the docs site to confirm the new snippets render and code samples are correct.
