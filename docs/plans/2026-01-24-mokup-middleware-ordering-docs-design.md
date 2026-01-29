# Mokup Middleware Ordering Docs Design

## Context

The middleware ordering API moved to `pre/normal/post` and requires `defineConfig`. The docs site needs a single Advanced page in English and Chinese that explains the new ordering, shows usage, and points to the mock examples under `apps/mokup-docs/mock`.

## Goals

- Add one Advanced doc page in both languages that explains `defineConfig` middleware ordering.
- Update the Advanced sidebar entries to include the new page.
- Reference existing `apps/mokup-docs/mock/example-*` folders as concrete examples.

## Non-goals

- No changes to runtime behavior.
- No new docs sections outside Advanced.
- No new examples beyond the mock folders already added.

## Plan

1. Add `apps/mokup-docs/docs/advanced/middleware-ordering.md` with concise usage and ordering rules.
2. Add `apps/mokup-docs/docs/zh/advanced/middleware-ordering.md` as a bilingual counterpart.
3. Update `apps/mokup-docs/docs/.vitepress/config/sidebar.ts` to link the new page in both sidebars.

## Notes

- Use `defineConfig` examples only; document that `pre/normal/post` are not available on plain object configs.
- Keep code snippets short and align them with the mock example directories.
