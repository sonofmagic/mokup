---
"@mokup/core": patch
"mokup": patch
---

Register the Service Worker fetch listener before asynchronous runtime app construction completes. Requests received while handlers or middleware are loading now wait for the runtime promise instead of falling through during the activation window.
