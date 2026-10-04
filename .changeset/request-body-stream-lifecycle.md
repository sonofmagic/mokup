---
'@mokup/shared': patch
'@mokup/core': patch
'@mokup/server': patch
---

Settle request body reads for streams that have already ended or closed, propagate stream errors, and release body buffers and owned listeners when reading finishes.
