---
"@mokup/core": patch
---

Protect Playground build output from deleting files outside its configured output directory. Reject paths that normalize to the output root or an ancestor or sibling, and paths through existing symbolic links beneath the output root, before removing or copying any output.
