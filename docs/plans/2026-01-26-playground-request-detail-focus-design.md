# Playground request detail focus and missing params cues

## Summary

Make the playground request detail panel more scannable by collapsing Config chain and Middlewares by default with persisted state, and highlight request tabs (Params, Query, Headers, Body) with compact badges. When missing route params are detected on Run, automatically focus the Params tab, scroll to the first missing input, and visually pulse the missing inputs plus the Params tab to guide the user.

## Goals

- Reduce vertical clutter in the route detail panel by default-collapsing Config chain and Middlewares.
- Persist user expand/collapse preferences across sessions.
- Emphasize the request tabs with concise badges (Params required, JSON labels, Body type).
- When missing params occur, surface the issue immediately with targeted visual cues and focus.

## Non-goals

- Rework the overall request panel layout or tab ordering.
- Add new validation logic beyond missing route params.
- Introduce new backend payload fields.

## Options Considered

- **Collapsible panels with persisted state (recommended)**: minimal layout change, keeps access to details.
- Limited height with "show more": still uses space and hides affordances.
- Move Config/Middlewares to a separate tab: clean but adds extra navigation.

## Recommended Approach

1. Convert Config chain and Middlewares blocks into collapsible panels with a shared header button and an expansion caret. Default to collapsed on first load. Persist open state in `localStorage` under a single key (e.g., `mokup.playground.detailPanels`).
2. Add compact tab badges: Params gets `Required`, Query/Headers get `JSON`, Body shows the active body type.
3. Expose missing param state from the request runner, so `RouteDetailRequest` can apply highlight/pulse classes to missing inputs and the Params tab. When a Run is blocked by missing params, auto-switch to the Params tab and scroll the first missing field into view.

## UI Behavior

- Config chain / Middlewares headers remain visible and clickable even when collapsed. Count pills remain visible.
- Missing params trigger: run button -> missing detected -> set missing list -> switch tab -> scroll to first missing input -> add pulse to missing inputs + Params tab for a short duration.
- Pulses should be subtle and time-bound; repeated runs retrigger the animation.

## State and Data Flow

- `usePlaygroundRequest` owns `missingParams` and exposes a `notifyMissingParams()` callback invoked by the request runner.
- `RouteDetailRequest` consumes `missingParams` to compute tab state, to bind input refs, and to trigger scroll/pulse.
- Panel expansion state is stored in a small local helper so both panel components can read/update without duplication.

## Error Handling

- Missing params blocks execution and does not mutate response status beyond the existing error text.
- Invalid JSON behaviors for Query/Headers/Body remain unchanged.

## Testing

- Unit test the missing params -> focus behavior (if UI tests exist).
- Manual checks: collapse persistence, missing params pulse on Run, auto-focus to Params, and scrolling to the first missing input.
