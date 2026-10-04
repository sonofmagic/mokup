---
"@mokup/core": patch
"mokup": patch
---

Apply Service Worker lifecycle scripts when opening the dynamic Playground directly in Vite preview. Register the existing built worker independently of current source routes, skip registration when its artifact is missing, and honor the current manual-registration and unregister settings without injecting development-only imports or HMR scripts.
