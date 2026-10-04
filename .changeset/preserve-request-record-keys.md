---
'@mokup/server': patch
---

Preserve all query parameter and header names during request normalization, including names such as `__proto__`, `constructor`, and `toString`. Keep repeated query values and ordinary object prototypes intact instead of mixing in inherited values or changing the result's prototype.
