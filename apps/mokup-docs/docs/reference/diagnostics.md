# Diagnostics

Mokup emits route-scan diagnostics when it finds files or rules that cannot be
used as normal routes. By default these diagnostics are logged as warnings with
a summary. You can promote selected diagnostics to build or startup errors with
`errorOn`.

## Supported categories

| Category             | Meaning                                                                             |
| -------------------- | ----------------------------------------------------------------------------------- |
| `invalid-route`      | A file could not be converted into a valid route path or method.                    |
| `unsupported-fields` | A rule still uses legacy fields such as `response`, `url`, or `method`.             |
| `missing-handler`    | An enabled rule does not provide a `handler`.                                       |
| `duplicate-route`    | Multiple files or rules resolve to the same `METHOD + path`.                        |
| `sw-conflict`        | Multiple SW entries disagree on `sw.path`, `sw.scope`, `register`, or `unregister`. |

## `errorOn`

Every modern Mokup entry point uses the same `errorOn` shape:

```ts
type DiagnosticErrorMode = 'all' | DiagnosticCategory[]
```

Use cases:

- Keep local development permissive, but make CI fail on bad route files.
- Allow incomplete mocks during migration while blocking duplicate routes.
- Enforce one service worker config across multiple entries.

Example:

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      errorOn: ['invalid-route', 'duplicate-route', 'sw-conflict'],
      entries: { dir: 'mock', prefix: '/api', mode: 'sw' },
    }),
  ],
}
```

Use `errorOn: 'all'` to fail on every supported category.

## Entry point support

| Entry point                | Supports `errorOn` | Notes                                                          |
| -------------------------- | ------------------ | -------------------------------------------------------------- |
| `buildManifest(...)`       | Yes                | Covers manifest route-scan diagnostics.                        |
| `mokup build --error-on`   | Yes                | CLI wrapper for `buildManifest(...)`.                          |
| `mokup(...)` Vite plugin   | Yes                | Covers route diagnostics and SW config conflicts.              |
| `createWebpackPlugin(...)` | Yes                | Covers route diagnostics and SW config conflicts.              |
| `createFetchServer(...)`   | Yes                | Fails standalone server startup on selected route diagnostics. |
| `mokup serve --error-on`   | Yes                | CLI wrapper for `createFetchServer(...)`.                      |

Notes:

- `sw-conflict` only applies to Vite and webpack plugin SW entries.
- CLI manifest and fetch server APIs accept the shared type shape for parity, but
  they do not emit service worker conflict diagnostics themselves.

## Behavior details

When `errorOn` matches a category:

- Mokup still builds the same diagnostics summary text.
- The summary is thrown as an `Error` instead of only being logged.
- The process fails at startup or build time instead of continuing.

When `errorOn` does not match:

- Diagnostics remain warnings.
- Route scanning continues where possible.
- Valid routes are still loaded.

## Recommendations

- Use `['duplicate-route']` first if you want a low-risk strictness upgrade.
- Add `invalid-route` and `missing-handler` next to catch common authoring mistakes.
- Use `sw-conflict` whenever you have more than one SW entry.
- Reserve `'all'` for CI or repositories with already-clean mocks.
