# Overview

Mokup is a file-driven HTTP framework that covers both dev and deployment:

- **Dev**: `mokup/vite` intercepts requests in Vite dev and serves route handlers.
- **Build**: CLI generates `.mokup` output (manifest + handlers).
- **Runtime**: `mokup/runtime` handles matching, delays, headers, and responses.
- **Adapters**: `mokup/server` provides Node adapters; `mokup/server/fetch` is runtime-agnostic; `mokup/server/worker` targets Workers.

Use it when:

- You want file-based HTTP routes for internal tools or production APIs.
- You need mockable endpoints or fast prototyping.
- You want one ruleset across multiple runtimes.
