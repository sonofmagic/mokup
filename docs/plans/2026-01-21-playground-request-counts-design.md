# Playground Request Counts

## Summary

Track per-route and total request counts in the playground UI for the current session only. Counts increment after a response is received and are displayed in the route list and header.

## Goals

- Show a per-route request count in the left route list.
- Show a total request count in the header.
- Count only after a response is received (no count on thrown errors).
- Keep counts session-only (no persistence).

## Non-goals

- Persist counts to localStorage or the server.
- Add new backend endpoints or schema changes.
- Track counts across page reloads.

## Approach

- Add `routeCounts` and `totalCount` state to `usePlaygroundRequest`.
- Use the existing route key format (`${method} ${url}`) to index counts.
- Capture the route key at request start, then increment the count only after `fetch()` resolves.
- Expose `getRouteCount(route)` and `totalCount` to `App.vue` and render in `RouteTree` and header.

## Error Handling

- If `fetch()` throws, do not increment.
- If the user switches routes mid-flight, the captured route key ensures counts land on the original request.
- SW readiness waits do not affect counting; counts still only update after the response resolves.

## Validation

- Run a request and confirm the route row count increments after the response.
- Trigger a failing request and confirm counts do not increment.
- Confirm the header total equals the sum of all route counts.
