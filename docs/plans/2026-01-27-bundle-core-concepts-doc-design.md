# Bundle Core Concept Docs

## Summary

Document the `mokupBundle` object and the roles of `manifest`, `moduleMap`, and
`moduleBase` in a new core concepts page, with a bilingual sidebar entry.

## Goals

- Explain what `mokupBundle` contains and when each field is required.
- Clarify the difference between CLI bundles, Vite virtual bundles, and
  cross-platform bundles.
- Add English and Chinese docs with the same structure.

## Non-Goals

- Changing runtime behavior or bundle output.
- Adding new APIs or build steps.

## Approach

- Add `apps/docs/docs/core-concepts/bundle.md` that covers:
  - bundle overview and use cases
  - `manifest` as the routing source of truth
  - `moduleMap` for module-based handlers in sandboxed runtimes
  - `moduleBase` and how it affects module resolution
  - bundle production paths (CLI, Vite, cross-platform)
  - common pitfalls and a minimal usage snippet
- Add `apps/docs/docs/zh/core-concepts/bundle.md` with a matching structure.
- Update `apps/docs/docs/.vitepress/config/sidebar.ts` to include the new page.

## Testing

- No new tests. Documentation-only change.
