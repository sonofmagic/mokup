---
'mokup': patch
---

Keep Node mock routes responsive to additions, deletions, and recreation after an empty Vite dev or preview startup. In Vite dev, reload the page to register the Service Worker when the first SW route appears and automatic registration is enabled. Update the worker to an empty route table when all SW routes are removed so requests return to the network.
