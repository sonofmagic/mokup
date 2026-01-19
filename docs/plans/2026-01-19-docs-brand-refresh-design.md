# Docs Brand Refresh Design

## Goals

- Apply the new pastel mascot logo across the docs site.
- Keep branding consistent between the navbar and homepage hero.
- Add gentle, playful styling without disrupting VitePress layout.

## Non-Goals

- Rewrite content or restructure documentation.
- Introduce heavy animations or replace the default theme.

## Approach

- Add the mascot SVG to `apps/docs/docs/public/brand/mokup-logo.svg`.
- Create a reusable `BrandLogo` component with size and text options.
- Wrap the default layout and inject:
  - `nav-bar-title`: small logo + Mokup text.
  - `home-hero-image`: large logo without text.
- Define pastel brand variables and subtle hero gradients in `custom.css`.

## Visual Notes

- Palette: sky blue + soft pink + warm yellow highlights.
- Font: friendly display font for brand areas, keep body readable.
- Background: gentle radial gradients for the hero to avoid a flat look.
