# Docs sync with source audit

## Summary

Audit all docs under `apps/docs/docs` and `apps/docs/docs/zh` to ensure they reflect current behavior, options, and examples from the codebase. Update only factual accuracy (flags, defaults, paths, behavior) while keeping the existing structure and voice.

## Goals

- Align CLI, Vite, Webpack, server, runtime, and playground documentation with current code.
- Keep English and Chinese pages in sync for factual content.
- Remove or correct outdated option names, defaults, or behavior descriptions.

## Non-goals

- Rewrite the docs structure or style beyond necessary corrections.
- Add new tutorials or extended examples not present in code.
- Introduce new features or behavior.

## Approach

1. Inventory all Markdown pages in `apps/docs/docs` and `apps/docs/docs/zh`.
2. For each page, extract claims about options, defaults, endpoints, or behaviors.
3. Validate claims against source code in `packages/mokup`, `packages/server`, `packages/playground`, and `apps/docs`.
4. Apply minimal edits to align facts and examples while preserving structure.
5. Mirror updates in both EN and ZH pages.

## Validation

- Manual skim of updated pages for consistency and obvious typos.
- Spot-check key features (playground behavior, config fields, CLI flags) against types and implementations.
