---
---

Improve e2e stability by hardening Vite readiness checks in `tests/e2e/run-app-e2e.mjs`.

- Require HTTP readiness to succeed instead of only warning when checks fail.
- Recover stale Vite lock files when the recorded lock owner process no longer exists.

