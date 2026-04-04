# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the `mokup` pnpm + Turbo monorepo. **Deployable apps and demos** live under `apps/`, while **publishable packages** live under `packages/`.

### Architecture

- **`apps/`** - Documentation and integration demos:
  - `mokup-docs/` - VitePress documentation site
  - `mokup-vite-*`, `mokup-webpack-demo/`, `mokup-node-demo/` - runnable integration examples
  - `mokup-web-demo/`, `mokup-d1-demo/`, `mokup-middleware-demo/` - runtime and deployment demos

- **`packages/`** - Publishable Mokup packages:
  - `mokup/` - main public package
  - `cli/`, `server/`, `runtime/`, `client/`, `core/`, `query/`, `shared/` - supporting packages
  - `playground/` - docs playground assets

### Build System

- **Package Manager**: pnpm (enforced by preinstall hook, requires pnpm@10.26.1)
- **Task Orchestration**: Turbo with caching and parallel execution
- **Library Bundler**: tsdown powered by Rolldown
- **Node Version**: `^20.19.0 || >=22.12.0`

## Development Commands

### Core Commands

| Command          | Description                                       |
| ---------------- | ------------------------------------------------- |
| `pnpm install`   | Install all workspace dependencies                |
| `pnpm dev`       | Run all apps in parallel (Turbo `dev --parallel`) |
| `pnpm build`     | Build all workspaces with Turbo caching           |
| `pnpm test`      | Run Vitest tests once                             |
| `pnpm test:dev`  | Run Vitest in watch mode                          |
| `pnpm lint`      | Run ESLint and Stylelint across all workspaces    |
| `pnpm typecheck` | Run TypeScript type checking                      |
| `pnpm format`    | Auto-fix code with ESLint                         |
| `pnpm validate`  | Run typecheck + lint + test (full validation)     |

### Release & Publishing

| Command                 | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `pnpm changeset`        | Create an interactive changeset for version bumps        |
| `pnpm publish-packages` | Build, lint, test, version, and publish changed packages |

### Monorepo Helper Scripts

| Command              | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `pnpm script:init`   | Initialize template settings                                 |
| `pnpm script:sync`   | Synchronize dependency and script versions across workspaces |
| `pnpm script:clean`  | Remove sample packages and generated artifacts               |
| `pnpm script:mirror` | Mirror configurations across workspaces                      |

### Git & Committing

| Command                  | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `pnpm commit`            | Interactive commit prompt (enforces Conventional Commits) |
| `pnpm commitlint --edit` | Validate commit message (runs as hook)                    |

## Code Organization

### Test Location

Tests are colocated with their targets in `test/*.test.ts` directories within each workspace. This mirrors the monorepo convention that keeps unit tests adjacent to the code they test.

### Public Assets

Each app manages its own public assets (e.g., `public/`, `worker/`) to keep deployments self-contained.

### Workspace Dependencies

Workspaces use `workspace:*` protocol for internal dependencies. Root `package.json` contains shared devDependencies that are inherited by workspaces.

## Coding Conventions

- **File Naming**: kebab-case for files (e.g., `user-table.vue`, `api-client.ts`)
- **Export Naming**: PascalCase for components, camelCase for utilities
- **Indentation**: 2 spaces (enforced by `.editorconfig`)
- **Line Endings**: LF (enforced by `.editorconfig`)
- **Language**: TypeScript (`.ts`/`.tsx`) and Vue SFCs preferred

## Quality & Standards

- **ESLint**: `@icebreakers/eslint-config` - auto-fixes staged files via lint-staged
- **Stylelint**: `@icebreakers/stylelint-config` for CSS/SCSS
- **Testing**: Vitest with v8 coverage (reports to `coverage/`)
- **Commits**: Conventional Commits required (enforced by commitlint + Husky)
- **Pre-commit Hooks**: Husky + lint-staged run `eslint --fix`, tests, and other checks

## Publishing Workflow

This monorepo uses Changesets for version management:

1. Make changes to packages
2. Run `pnpm changeset` to describe changes (patch/minor/major)
3. After merging, run `pnpm publish-packages` locally or let CI publish from `main`
4. Ensure `secrets.NPM_TOKEN` is configured in GitHub for automated publishing

When modifying publishable packages, always create a changeset so releases stay traceable.

## Current Upgrade Notes

- Published packages are ESM-only.
- Internal package builds have been migrated from `unbuild` / `tsup` to `tsdown`.
- Shared build helpers live under `@mokup/shared/rolldown`.
