# Docs SW Usage Additions

## Summary

Add Service Worker usage coverage to the docs site so users can choose browser-side mocking with the Vite plugin. The update focuses on three reference pages (Vite plugin, Vite build output, and manifest schema) in both English and Chinese. The goal is to describe configuration, defaults, and deployment implications clearly, with minimal changes to the rest of the site.

## Goals

- Document `mode: 'sw'` and the `sw` options (`path`, `scope`, `register`, `fallback`) in the Vite plugin reference.
- Show practical examples for single-entry and mixed-entry configs, including per-entry overrides.
- Explain build behavior for SW output and static hosting, including the default SW path and registration injection.
- Clarify manifest fields related to SW output: `middleware`, `ManifestModuleRef`, and `ruleIndex` usage.

## Non-goals

- Change runtime behavior, CLI output, or plugin logic.
- Rework unrelated docs or restructure navigation.
- Provide full deployment guides for every host (only add SW-specific notes).

## Approach

1. Vite plugin reference: replace the broken options table with a clean 3-column table that includes `mode` and `sw`. Add a dedicated Service Worker section that describes defaults (path and scope), automatic registration, manual registration via `mokup/sw`, and `sw.fallback` behavior. Include examples for basic SW usage and a mixed server/SW setup to highlight per-entry configuration.

2. Vite build output: add a Service Worker build section that explains that the SW script is emitted during `vite build` and is suitable for static hosting without a server runtime. Provide a minimal config example and a note that the playground requires a static `/__mokup/routes` JSON file when there is no server.

3. Manifest schema: extend the schema snippet to include `middleware` and `ManifestModuleRef`. Add a short note on `ruleIndex` selection for array exports and the different `module` path formats used by CLI and SW builds.

## Validation

- Build the docs app and confirm that the new sections render correctly in both languages.
- Verify that code snippets match the current API and defaults.
- Spot-check the playground routes note for static hosting clarity.
