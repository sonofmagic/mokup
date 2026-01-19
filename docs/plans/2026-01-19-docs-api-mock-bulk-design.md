# Docs API Mock Bulk Design

## Overview

Add roughly 200 mock API endpoints under `apps/docs/mock/api/**` to cover SaaS, ecommerce, and social domains. Existing mocks in `apps/docs/mock` will be removed (except `index.config.ts`) and replaced by the new `/api` directory structure. The goal is a large, browseable mock surface for the docs playground with stable, predictable response shapes.

## Goals

- Generate ~200 mock routes under `/api/*` using file-based routing.
- Cover SaaS, ecommerce, and social modules with consistent data shapes.
- Keep most responses static JSONC; use minimal TS for dynamic `id` and pagination.
- Ensure routes are easy to discover and stable for frontend usage.

## Non-goals

- No real data persistence or auth flows.
- No random data generation that changes between requests.
- No additional automated tests beyond manual verification.

## Route Layout

Routes live in `apps/docs/mock/api/` with module folders, for example:

- `apps/docs/mock/api/users.get.json` -> `GET /api/users`
- `apps/docs/mock/api/users/[id].get.ts` -> `GET /api/users/:id`

Modules (approx. allocation):

- SaaS: auth, users, orgs, projects, billing, notifications, analytics, settings
- Ecommerce: catalog, cart, orders, payments, shipping, reviews, inventory
- Social: profiles, friends, feed, messages, media, groups

Each module includes CRUD plus 2-4 action endpoints (e.g. `login`, `cancel`, `accept`, `follow`, `charge`).

## Data Shapes

Common fields:

- `id` with module prefix (e.g. `usr_`, `ord_`)
- `createdAt`, `updatedAt` ISO strings
- `status` enum

List responses:

```
{
  "items": [ ... ],
  "page": 1,
  "pageSize": 10,
  "total": 42
}
```

Detail responses return a single object. Create/update return `{ ok: true, data }`. Delete returns `{ ok: true }` or `204`.

Dynamic routes use TS to read `req.params` and shape deterministic responses; pagination uses fixed lists with optional query slicing.

## Errors and Status Codes

- `201` for create, `200` for read/update, `204` or `{ ok: true }` for delete.
- A small set of explicit error routes (10-15):
  - `auth/login.post.ts` can return `401` for invalid credentials.
  - `payments/charge.post.ts` can return `402`.
  - `orders/[id]/cancel.post.ts` returns `409` when status is `shipped`.

Global headers and delay stay in `apps/docs/mock/index.config.ts`.

## Implementation Approach

- Remove existing mocks under `apps/docs/mock` except `index.config.ts`.
- Generate module folders and route files under `apps/docs/mock/api`.
- Use JSONC for static routes; TS for dynamic `id` and pagination.
- Optionally retain a small generator script under `apps/docs/scripts/` for future changes.

## Verification

- Run docs playground and verify `/api` routes appear and are grouped.
- Spot-check 5-10 key routes for shape, status, and dynamic behavior.

## Rollout Notes

- This is a docs-only mock surface; no changes to production services.
- File count will increase, but routing remains predictable.
