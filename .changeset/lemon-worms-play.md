---
"@mokup/playground": patch
---

Improve request editing in playground with a CodeMirror-based editor for query, headers, and body fields.

Load the editor lazily via async component and tab-gated mounting so initial bundle load remains lightweight.
