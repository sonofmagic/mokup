# Mokup UVR-Style File Routing Design

## Goals

- Switch mock file routing to UVR-style file paths with bracketed params.
- Require HTTP method suffixes in filenames (e.g. `.get`, `.post`).
- Provide consistent matching in dev middleware and runtime manifest handling.
- Expose route params to handlers via `req.params`.

## Non-goals

- Route groups `(group)` are not supported.
- Backward compatibility with `.mock` filenames is not required.

## File Naming Rules

- A mock file must end with a method suffix: `.get`, `.post`, `.put`, `.patch`, `.delete`, `.options`, `.head`.
- URL path is derived from the file path without the method suffix.
- `index` maps to its parent path (e.g. `users/index.get.json` -> `/users`).
- Dynamic segments: `[id]` -> `params.id`.
- Catch-all segments: `[...slug]` -> `params.slug` (string array).
- Optional catch-all: `[[...slug]]` -> empty array when absent.

## Route Template Parsing

- Templates are tokenized into static, param, catch-all, and optional catch-all tokens.
- Catch-all and optional catch-all must be the final segment.
- Invalid segments or route groups emit warnings and skip the file.
- Duplicate param names emit warnings but are allowed.

## Matching & Priority

- Match order: static > param > catch-all, with more specific paths first.
- Matching produces `params: Record<string, string | string[]>`.
- Dev middleware and runtime share the same token parsing + match logic.

## Manifest Changes

- Manifest remains version `1`.
- Each route stores:
  - `url`: normalized template (with prefix applied).
  - `tokens`: parsed route tokens.
  - `score`: sort weights for deterministic matching.
  - `source`: file path for debugging.

## Error Handling

- Missing method suffix: warn and skip.
- Invalid template syntax: warn and skip.
- Duplicate route templates: warn and keep the latest entry.

## Demo Updates

- Replace `.mock` filenames with method suffix files.
- Add dynamic and catch-all examples:
  - `mock/users/[id].get.ts`
  - `mock/reports/[...slug].get.ts`
  - `mock/docs/[[...slug]].get.ts`
- Shorten ignored filenames and exclude by folder path.

## Testing

- Manual verification via `apps/web` playground.
- Validate params, catch-all behavior, and routing priority.
