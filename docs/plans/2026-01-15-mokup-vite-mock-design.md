# Mokup Vite Mock Plugin Design

## Goals

- Provide a Vite plugin at `mokup/vite` that serves mock APIs from a folder.
- Support `json`, `jsonc`, and `mock.[tj]s` with hot updates.
- Allow both filename- and file-content-based route definitions.
- Provide `.d.ts` for editor IntelliSense.

## Package Layout

- `packages/mokup/src/index.ts`: shared types and helpers.
- `packages/mokup/src/vite.ts`: default export `mokup(options)` Vite plugin.
- Build via `unbuild` to emit ESM/CJS and `.d.ts`.

## Config

```ts
export interface MokupViteOptions {
  dir?: string | string[] | ((root: string) => string | string[])
  prefix?: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  watch?: boolean
  log?: boolean
}
```

- `dir` defaults to `<root>/mock`, can override or return multiple folders.
- `prefix` defaults to empty string.
- `watch` defaults to true; only used in dev/preview.

## Route Mapping

- A file becomes one or more route rules.
- URL derived from file path when missing:
  - Strip extension and method suffix (e.g. `.get.json`).
  - Map `/index` to its directory.
  - Apply `prefix` if present.
- Method resolution:
  - Filename suffix (e.g. `.get.json`) wins.
  - Else `rule.method`.
  - Else default `GET`.

## File Formats

- `json/jsonc`: file content is response body.
- `mock.[tj]s` or any `.ts/.js` with default export:
  - Single rule object or array of rules.
  - Rule fields: `url`, `method`, `response`, `status`, `headers`, `delay`.
  - `response` can be a value or a function.

## Runtime Behavior

- Plugin registers connect middleware in both dev and preview.
- Matches method + path and responds, otherwise calls `next()`.
- Parses `query` and body (`json`, `form`, `text`).
- Provides `ctx` helpers: `delay(ms)` and `json(data)`.

## Error Handling

- JSON/JSONC parse errors warn and skip the file.
- TS/JS load errors warn and remove the routes for that file.
- Handler errors return 500; dev includes stack traces.

## Hot Updates

- Dev: use Vite watcher to re-scan changed file(s).
- Preview: use chokidar to re-scan.
- Debounce updates and clean up deleted routes.

## Testing

- Unit tests for path->url and method resolution.
- Parser tests for json/jsonc and TS/JS rules.
- Integration tests with `createServer` to verify responses, headers, and HMR.
