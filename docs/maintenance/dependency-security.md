# Dependency Security Maintenance

## Security Overrides

Use security overrides in `pnpm-workspace.yaml` to select patched transitive dependencies within their parents' supported version ranges. Keep each selector limited to the affected version line and retain the published packages' Node.js requirement. For example, the `markdown-it` override stays on version 14 and `@humanfs/node` stays on version 0.16.

Review the parent dependency range before changing an override. Remove an override when normal dependency resolution provides the required fix, then regenerate the lockfile and run the checks below. Keep advisories visible in `pnpm audit`; dependency presence alone does not establish whether the vulnerable operation is reachable.

## Drizzle Kit Loader Workaround

The override `drizzle-kit@0.31.11>@esbuild-kit/esm-loader: '-'` removes an unused dependency from that exact stable release. Its deprecated loader pulls in `@esbuild-kit/core-utils` and `esbuild@0.18.20`, which is affected by [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99).

Review of all 13 published files found `@esbuild-kit/esm-loader` referenced only in `package.json`. The CLI already embeds tsx registration, and the CommonJS and ESM API entries use `tsx/cjs/api`. Refreshing the separate tsx dependency to `4.23.15` satisfies Drizzle Kit's `^4.21.0` range and replaces its older esbuild dependency with the patched 0.28 line.

Keep the stable Drizzle Kit migration format. The available 1.0 prereleases also change migration storage, including conversion of `meta/_journal.json` and top-level SQL files into per-migration directories; adopting them requires a separate migration review.

When upgrading Drizzle Kit, inspect every published entry point again and remove this scoped workaround once upstream removes the unused dependency. Resolve the installed package's real path before checking its internal tsx version. Validate `generate`, `check`, a second generation with no schema changes, and a schema change in a temporary copy of the D1 demo. Validate the generated SQL using a disposable SQLite database.

## Advisories Awaiting Upstream Fixes

The following versions had no published patched release when reviewed on 2026-10-04. These mitigations reduce exposure and require continued review.

### http-cache-semantics 4.2.0

- Advisory: [GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp), high severity.
- Representative path: `repoctl → @icebreakers/monorepo → pacote → npm-registry-fetch → make-fetch-happen → http-cache-semantics`.
- Trigger: a shared cache contains another user's sensitive response whose lifetime was zeroed for security reasons. A request for the same URL with a large `max-stale` value can reuse it and disclose data such as `Set-Cookie` credentials.
- Mitigation: isolate package and CI caches across users, credentials, and trust boundaries. Do not expose installation caches as a shared HTTP cache accepting untrusted requests. This tooling dependency still needs an upstream fix.

### braces 3.0.3

- Advisory: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), high severity.
- Representative paths: `stylelint → micromatch → braces`, repoctl's tooling dependencies, and `webpack-dev-server → http-proxy-middleware → micromatch → braces`.
- Trigger: attacker-controlled, deeply nested brace patterns reach recursive AST processing. Patterns can stay below the character limit while exhausting the call stack and terminating the process with an uncaught `RangeError`.
- Mitigation: keep glob and proxy patterns controlled by repository configuration. If external patterns are accepted, limit both length and nesting depth before processing. A normal HTTP request does not by itself demonstrate that the vulnerable pattern processing is reachable.

## Recheck Commands

```sh
pnpm audit --json
pnpm why -r http-cache-semantics
pnpm why -r braces
pnpm why -r esbuild
pnpm view http-cache-semantics version
pnpm view braces version
pnpm view drizzle-kit@latest dependencies --json
```

Compare the current advisory details and dependency paths with the upstream releases before changing overrides. Audit returns a nonzero status while advisories remain; review its output rather than suppressing findings.

After updating dependencies and the lockfile, verify reproducibility and run the repository checks:

```sh
pnpm install --frozen-lockfile
pnpm exec repo doctor
pnpm run release:check
```
