# Playground Server WS Counts

## Summary

When running in server mode, track mock route call counts on the server and push updates to the playground UI over WebSocket. The playground uses server counts when the WebSocket is connected and falls back to local counts otherwise.

## Goals

- Count calls on the server (global counts, in-memory).
- Push a snapshot on WebSocket connect, then increment events after each response.
- Use `/\_mokup/ws` as the playground WebSocket endpoint.
- Keep the client UI in sync without polling.

## Non-goals

- Persist counts across process restarts.
- Store counts per-client or per-session.
- Add non-WebSocket transport fallbacks beyond the existing local counts.

## Approach

- Extend `createHonoApp` to accept an `onResponse` hook and call it after the final response is produced.
- In `createFetchServer`, maintain `routeCounts` and `totalCount` keyed by `method + " " + template`.
- Broadcast `{ type: "increment", routeKey, total }` to all WebSocket clients after each response.
- On WebSocket open, send `{ type: "snapshot", total, perRoute }`.
- Use `@hono/node-ws` to register a `/\_mokup/ws` endpoint and expose `injectWebSocket` for Node servers.
- In the playground, connect to `${basePath}/ws`, apply snapshot, then apply increments.
- When WS is connected, disable local increments; on close/error, fall back to local counting.

## Validation

- Start the mock server and open the playground: confirm it receives a snapshot and shows counts.
- Trigger a route and confirm server increments and pushes an update.
- Close the WS connection and confirm the UI continues counting locally.
