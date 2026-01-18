# Mokup Docs Site Design

## Goals

- Add a new `apps/docs` VitePress site for Mokup documentation.
- Provide comprehensive bilingual docs (zh-CN + en-US).
- Structure content around: Getting Started, Core Concepts, Advanced, Deploy, Reference.
- Keep docs easy to extend and consistent between locales.

## Non-goals

- Build a custom theme from scratch.
- Introduce a complex search solution or external CMS.
- Replace existing README usage in packages.

## Site Structure

Create a new app at `apps/docs` with this layout:

- `apps/docs/docs/.vitepress/config.ts`
- `apps/docs/docs/.vitepress/theme/index.ts`
- `apps/docs/docs/.vitepress/theme/custom.css`
- `apps/docs/docs/index.md` (zh-CN)
- `apps/docs/docs/en/index.md` (en-US)
- Content groups mirrored in `docs/` and `docs/en/`.

## Navigation and i18n

- Default locale: zh-CN at `/`.
- English locale: `/en/`.
- Both locales share the same information architecture and sidebar ordering.
- Navigation groups:
  - Getting Started
  - Core Concepts
  - Advanced
  - Deploy
  - Reference

## Content Coverage

Include:

- CLI usage (`mokup build`, output `.mokup`, manifest/bundle files).
- Mock file conventions (`.get/.post`, JSON/JSONC, route params).
- Runtime/server/worker usage patterns.
- Vite integration and playground linkage.
- Deployment guidance (Vite output and Cloudflare Worker flow).
- Reference for options, manifest schema, and common pitfalls.

## Styling

- Use a custom font stack and light visual polish via `custom.css`.
- Add subtle gradients and a small motion cue on the home hero.
- Keep VitePress base layout intact for usability.

## Testing

- Provide `pnpm --filter docs dev/build/preview` scripts.
- Optional build verification via `pnpm --filter docs build`.
