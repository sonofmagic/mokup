# Playground Disabled Routes Design

## Goals

- Show ignored/disabled mock routes in the Playground UI.
- Include the reason for why a route is not active.
- Keep Vite/webpack playground and server playground behavior consistent.

## Non-goals

- Do not attempt to execute disabled routes.
- Do not infer disabled reasons on the client.
- Do not add a separate API endpoint for disabled routes.

## API Contract

Extend the existing `/routes` response with a `disabled` array.

```ts
interface PlaygroundDisabledRoute {
  file: string
  reason: 'disabled' | 'disabled-dir' | 'ignore-prefix' | 'include' | 'exclude' | 'unknown'
  method?: string
  url?: string
  group?: string
  groupKey?: string
}

interface PlaygroundResponse {
  basePath: string
  root?: string
  count: number
  groups?: PlaygroundGroup[]
  routes: PlaygroundRoute[]
  disabled?: PlaygroundDisabledRoute[]
}
```

## Scanner Collection

- Add an optional collector to scanners to record skipped entries.
- Reasons:
  - `disabled`: per-file `enabled: false`.
  - `disabled-dir`: directory config `enabled: false`.
  - `ignore-prefix`: path segment matched ignorePrefix.
  - `include` / `exclude`: filtered by include/exclude.
- For ignore/include/exclude cases, try a best-effort route derivation
  using a silent logger to avoid console noise. If derivation fails,
  only populate `file` + `reason`.

## Playground Response

- `packages/mokup/src/vite/playground.ts` and
  `packages/server/src/dev/playground.ts` build the `disabled` list
  alongside `routes`.
- Use existing group resolution to populate `group`/`groupKey` based on
  file location for consistent grouping.

## UI/UX

- Add a top-level toggle in the left panel: `Active` / `Disabled`.
- `Active` uses the current route tree; `Disabled` uses a disabled list.
- Disabled rows are not executable and show a reason badge.
- Search filters the active tab only and matches
  `method/url/file/reason`.
- Switching to `Disabled` clears the selected route and shows a
  non-executable empty state on the right panel.

## Error Handling

- If a reason cannot be determined, fall back to `unknown`.
- If method/url cannot be derived, display only the file path.

## Testing

- Update playground route endpoint tests to assert `disabled` output:
  - `packages/mokup/test/playground.test.ts`
  - `packages/server/test/dev-playground.test.ts`
- Add a lightweight UI assertion (if needed) to check tab rendering and
  counts; avoid heavy interaction testing.
