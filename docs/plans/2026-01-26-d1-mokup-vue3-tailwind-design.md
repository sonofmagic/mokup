# D1 Mokup Vue3 + Tailwind v4 Frontend Design

## Goal

Refactor the `apps/d1-mokup` frontend to Vue 3 using Tailwind CSS v4 while keeping the existing feature set: GitHub OAuth sign-in, email/password sign-in + sign-up, user list display, user creation, and status messaging. Visual direction is retro collage with bold typography, paper textures, and punchy accents.

## Architecture

- Replace the static HTML + vanilla JS with a Vue 3 SPA.
- Use `@tailwindcss/vite` to enable Tailwind v4 in Vite.
- Keep a single `App.vue` (script setup) to match the requested single-file approach.
- `src/main.ts` only mounts the app; `index.html` only includes `#app` plus font links.
- Global `src/style.css` contains `@import "tailwindcss";` and minimal custom base styles (fonts, background texture, collage effects).

## Components

Single component:

- `App.vue`: Hero section with CTA buttons, email auth form, users list + create form, and status block.

## Data Flow

- `authClient = createAuthClient({ baseURL: location.origin })`.
- `onMounted` triggers `loadUsers()` to GET `/api/users`.
- Buttons call `authClient.signIn.social`, `authClient.signOut`.
- Email form calls `authClient.signIn.email` or `authClient.signUp.email` based on button.
- Create user form POSTs to `/api/users`, then refreshes the list.

## Error Handling

- Minimal validation on inputs before API calls.
- All async actions wrapped in try/catch and update `status` text.
- Avoid clearing existing user list on failures.

## Styling

- Retro collage: paper-toned background, bold serif headline, chunky outlines, offset shadows.
- Use Tailwind for layout and spacing, plus a small set of custom utilities in `style.css` for texture and accents.
- Responsive layout: stacked sections on mobile, grid on desktop.

## Testing

- Manual checks: page load, user list fetch, create user, email sign-in/sign-up, GitHub OAuth redirect.

## Open Questions

- None.
