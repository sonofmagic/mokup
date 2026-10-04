---
"@mokup/core": patch
"@mokup/server": patch
"mokup": patch
---

Reject non-HTTP URL schemes in Node request targets before matching mock or Playground routes. Return a bad-request error for FTP, WebSocket, file, and other non-HTTP targets while preserving ordinary paths, leading double slashes, and absolute HTTP(S) URLs.
