---
'@mokup/shared': patch
---

Guard request stream failures while adapters await asynchronous route matching, without consuming the body. Preserve original stream errors, reject premature closure, and handle queued destruction errors when handing the request to its next owner.
