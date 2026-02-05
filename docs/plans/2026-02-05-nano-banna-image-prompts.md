# Nano Banna Image Prompts (Mokup Unified Mock Library)

Use a consistent, real-product-screenshot style across all images. Recommended output: 16:9 (1600×900 or 1200×675).

## Global Style (include in every prompt)

Real product screenshot style, modern SaaS UI, light theme, soft shadows, high resolution, crisp and sharp, clean whitespace, macOS vibe, smooth rounded corners, thin line icons, typography similar to Inter / SF Pro, professional and restrained.

## 1) Mokup Logo (brand)

**Target file:** `/brand/mokup-logo.svg`

**Prompt:**
Mokup brand logo design, flat vector style, light background, wordmark + icon combination. The icon should convey simplified "links / routing / nodes" concept. Color palette: deep blue #1E3A8A + cyan #0EA5E9 + neutral gray. Centered layout with generous whitespace. Real brand logo feel for documentation site.

**Negative prompt:**
No complex textures, no 3D, no photos, no noise, no extra text.

## 2) Unified Runtime Flow (concept page)

**Target file:** `/blog/mokup-unified-mock-library/unified-runtime-flow.png`

**Prompt:**
A realistic product dashboard page screenshot. Top title: "Unified Runtime Flow". Center shows a flow of cards: mock/ → scanner → manifest → runtime, then splits to Vite / Node / Worker cards on the right. Looks like a product "architecture view" page. Light background, cards with subtle shadows and thin borders, minimal icons, clear labels. Add a small sidebar on the left (light gray placeholders).

**Negative prompt:**
No cartoon style, no hand-drawn, no neon sci-fi.

## 3) Mock Folder Tree (file explorer UI)

**Target file:** `/blog/mokup-unified-mock-library/mock-folder-tree.png`

**Prompt:**
A realistic in-app file explorer screenshot. Left panel file tree: mock/ expanded with users.get.ts and index.config.ts. Right panel empty editor area or light placeholder. Top has a path bar. Looks like a modern web IDE or repo browser. Light theme, thin line icons, crisp text.

**Negative prompt:**
No dark theme, no long code blocks, no watermarks.

## 4) Playground Entry (terminal output)

**Target file:** `/blog/mokup-unified-mock-library/playground-entry.png`

**Prompt:**
macOS terminal window screenshot running `pnpm dev`, showing Vite startup output. Highlight the line: "Mokup Playground: http://localhost:5173/\_\_mokup" with a thin red rectangle. Realistic terminal look, readable text. Light or dark terminal is fine, but keep clarity.

**Negative prompt:**
No blur, no misspelling, no extra icons.

## 5) Playground Route Detail (UI)

**Target file:** `/blog/mokup-unified-mock-library/playground-detail.png`

**Prompt:**
Mokup Playground route detail page screenshot. Left panel: route tree list with method tags. Right panel: request detail with method POST, path /api/login, sections for params, headers, body, and response. Top has search and status buttons. Looks like a real SaaS console, light theme, clean layout.

**Negative prompt:**
No cartoon style, no hand-drawn, no garbled text.

## 6) Worker Build / CLI Output (terminal)

**Target file:** `/blog/mokup-unified-mock-library/cli.png`

**Prompt:**
Terminal/CLI screenshot showing bundle build or Worker deploy output. Include keywords like "mokup bundle" or "worker" and a success line like "build succeeded". Realistic terminal style, concise output, clean and readable.

**Negative prompt:**
No long noisy logs, no blur, no excessive decorations.
