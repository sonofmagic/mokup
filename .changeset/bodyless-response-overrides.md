---
'@mokup/shared': patch
'@mokup/core': patch
'@mokup/runtime': patch
'@mokup/server': patch
---

Apply 204, 205, and 304 route status overrides without attempting to construct an invalid Fetch response with a body. Cancel discarded response streams, remove payload framing headers from 204 and 205 responses, and retain representation metadata on 304 responses.
