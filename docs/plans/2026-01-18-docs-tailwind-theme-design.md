# Docs Tailwind Theme Redesign

## Goals

- Redesign the entire VitePress docs UI with a light, brand-forward theme.
- Use Tailwind CSS v4 for styling and tokens.
- Keep full VitePress functionality (nav, sidebar, outline, search).
- Support both light and dark modes with consistent visual language.

## Visual Direction

- Palette: ocean blues for base surfaces, coral for emphasis.
- Typography: Fraunces (display) + Manrope (body), JetBrains Mono (code).
- Atmosphere: layered gradients and soft shadows, no flat backgrounds.

## Implementation Plan

- Install `@tailwindcss/vite` + `tailwindcss` in `apps/docs`.
- Register Tailwind Vite plugin in `docs/.vitepress/config.ts`.
- Replace `docs/.vitepress/theme/custom.css` with Tailwind v4 CSS:
  - `@import "tailwindcss";`
  - `@theme` tokens for colors and fonts.
  - `:root` / `.dark` overrides for `--vp-*` variables.
  - `@layer base` for typography, links, selection, and background.
  - `@layer components` for nav, sidebar, doc shell, features, and blocks.

## Key Overrides

- `--vp-c-bg`, `--vp-c-brand-*`, `--vp-c-text-*`, `--vp-c-divider`
- `--vp-home-hero-*`, `--vp-code-*`
- Custom backgrounds and drop shadows for primary surfaces.

## Testing

- Run `pnpm -C apps/docs dev` and validate layout in light/dark.
- Check `/playground` still loads and inherits the global theme.
