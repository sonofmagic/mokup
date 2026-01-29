# Web Vue Mokup Demo Design

## Goals

- Add a Vite + Vue 3 + TypeScript demo app under `apps/mokup-web-demo`.
- Use the `mokup/vite` plugin to serve mock APIs from `apps/mokup-web-demo/mock`.
- Use axios via a small `src/api` module.
- Provide two example endpoints: one GET via JSON and one POST via mock TS.

## App Structure

- `apps/mokup-web-demo/index.html`: Vite entry HTML.
- `apps/mokup-web-demo/src/main.ts`: Vue bootstrap and global styles.
- `apps/mokup-web-demo/src/App.vue`: Demo UI and state handling.
- `apps/mokup-web-demo/src/style.css`: App styling.
- `apps/mokup-web-demo/src/api/client.ts`: axios instance.
- `apps/mokup-web-demo/src/api/index.ts`: `fetchProfile()` and `login()` helpers.
- `apps/mokup-web-demo/mock/profile.get.json`: GET response example.
- `apps/mokup-web-demo/mock/login.post.ts`: POST response example.

## Plugin Usage

`vite.config.ts` uses:

```ts
import mokup from 'mokup/vite'

export default defineConfig({
  plugins: [
    mokup({ dir: 'mock' }),
  ],
})
```

## Data Flow

- Vite dev server starts with `mokup` middleware.
- Axios calls hit the mock routes:
  - `GET /profile` from `profile.get.json`.
  - `POST /login` from `login.post.ts`.
- The UI renders raw JSON and a summary message for each response.

## Error Handling

- Mock errors are logged server-side; the UI shows a compact error message.
- Axios failures are captured and shown inline.

## Testing

- Manual verification by running `pnpm dev` and clicking the buttons.
