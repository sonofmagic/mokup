---
'mokup': patch
---

Handle invalid request URLs safely in Vite, preview, and Webpack Service Worker middleware. Return a readable 400 response for malformed URLs and preserve leading double slashes as part of HTTP request paths instead of interpreting them as a hostname.
