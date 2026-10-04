---
"@mokup/cli": patch
"@mokup/shared": patch
---

Keep generated handler and middleware imports aligned with their bundled files when mock directories are outside the project root. Preserve separate outputs for sources with the same filename, retain existing paths for in-project handlers, and report conflicting output names instead of silently replacing an entry.
