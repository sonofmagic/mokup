---
"@mokup/playground": patch
---

Improve playground hot-reload UX by keeping the existing sidebar tree visible while routes refresh, and showing a lightweight in-place loading indicator instead of replacing the tree with a full loading state.

Add route-state tests to ensure reloads preserve existing list and selection until new data arrives.
