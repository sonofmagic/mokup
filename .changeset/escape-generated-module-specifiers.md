---
"@mokup/cli": patch
"@mokup/core": patch
"mokup": patch
---

Escape generated module imports and handler map keys so paths containing quotes, backslashes, or line breaks preserve their identity in bundles, Service Workers, CLI handler indexes, and Playground HMR scripts.
