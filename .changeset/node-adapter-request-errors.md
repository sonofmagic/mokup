---
'@mokup/server': patch
---

Pass Connect and Express adapter errors to the framework error handler, report malformed HTTP URLs and Host headers as bad requests, and preserve paths beginning with two slashes.
