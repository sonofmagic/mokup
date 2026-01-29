# Playground multipart file upload support

## Goals

- Allow the Playground to send `multipart/form-data` requests that include files.
- Keep the existing key=value textarea for text fields, and add a file picker area for multipart only.
- Provide mock examples in `apps/mokup-vite-sw-demo` and `apps/mokup-vite-server-demo` to demonstrate file uploads.

## Non-goals

- No file uploads for `application/x-www-form-urlencoded`.
- No restructuring of the request builder UI beyond the multipart file section.

## Architecture & data flow

- Add a new `multipartFiles` state array to `usePlaygroundRequest` to track file rows.
- Each row is `{ id, name, files[] }` and persists across route changes (mirrors existing body text behavior).
- The request runner merges text fields from the textarea with file rows when `bodyType === 'multipart'`:
  - parse key=value entries from the textarea
  - append each text entry to `FormData`
  - append each file to `FormData` under its row name
  - skip rows with empty names
- If no text entries and no files exist, omit the body.

## UI & component changes

- In `RouteDetailRequest`, render a “Files” section only when `bodyType === 'multipart'`.
- Each row includes a field name input, a multi-file picker, and a remove button.
- Add a compact “Add file field” button to create rows.
- Add i18n strings for labels and file counts in `messages-en.ts` and `messages-zh.ts`.
- Plumb `multipartFiles` through `PlaygroundContent` → `RouteDetail` → `RouteDetailRequest` using `v-model`.

## Error handling & behavior

- Ignore file rows with empty names.
- Do not set `Content-Type` manually for multipart (let the browser set the boundary).
- Preserve file rows when switching body types, but only use them for multipart.

## Testing

- Extend `request-runner` tests to assert:
  - FormData includes text fields and files for multipart.
  - Files-only multipart still builds a FormData body.
- Manual verification:
  - Use Playground to send a multipart request with text + files.
  - Verify the new mock endpoints in `apps/mokup-vite-sw-demo` and `apps/mokup-vite-server-demo` receive files.
