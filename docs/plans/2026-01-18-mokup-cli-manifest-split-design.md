# Mokup CLI Manifest Split Design

## Goals

- Split `packages/cli/src/index.ts` into responsibility-focused modules.
- Keep the public API stable: `buildManifest` and `BuildOptions` remain exported.
- Preserve current output behavior while adding `mokup.manifest.mjs` for ESM use.
- Improve test coverage for manifest output artifacts.

## Non-goals

- Redesign the CLI argument parsing or add new CLI commands.
- Change mock file conventions, method suffix rules, or route parsing behavior.
- Alter handler bundling semantics beyond the new manifest module output.

## Proposed Structure

- `src/index.ts`: public exports only (`buildManifest`, `BuildOptions`).
- `src/manifest/index.ts`: orchestration for `buildManifest`.
- `src/manifest/types.ts`: `BuildOptions`, `RouteRule`, and shared internal types.
- `src/manifest/routes.ts`: route derivation, prefix/method normalization, and scoring sort.
- `src/manifest/files.ts`: file discovery, filters, and path helpers.
- `src/manifest/rules.ts`: reading JSON/TS/JS mocks into normalized rules.
- `src/manifest/handlers.ts`: handler bundling and `mokup-handlers` index output.
- `src/manifest/bundle.ts`: `mokup.bundle.*` and `mokup.manifest.mjs` output.

## Data Flow

`buildManifest` resolves directories and scans files, then:

1. Derives route templates from file names.
2. Loads mock rules (JSON/TS/JS) and normalizes responses.
3. Collects handler modules when functions are used.
4. Builds a manifest, sorts routes by method/score, and writes outputs.
5. Optionally bundles handlers and writes bundle/manifest modules.

## Output Artifacts

- `mokup.manifest.json`: retained for compatibility.
- `mokup.manifest.mjs` + `mokup.manifest.d.mts`: ESM manifest module.
- `mokup.bundle.mjs` + `mokup.bundle.d.ts/.d.mts`: bundle imports manifest module.
- `mokup-handlers/*`: handler bundles and `mokup-handlers/index.*` when needed.

## Error Handling

- Invalid JSON/JSONC yields no rules for that file.
- Route parsing errors/warnings are logged but do not crash the build.
- Duplicate routes are logged; last one wins in ordering.

## Testing

- Keep existing manifest tests intact.
- Add a test that asserts `mokup.manifest.mjs` and `.d.mts` are emitted.
- Add a test that confirms `mokup.bundle.mjs` imports the ESM manifest module.
