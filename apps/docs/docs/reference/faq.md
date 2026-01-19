# FAQ

## Why do JSON mocks need method suffixes?

CLI builds use file names to determine HTTP methods. The Vite plugin defaults `.json/.jsonc` to `GET`, but explicit suffixes are recommended for consistency.

## Worker shows node builtin warnings

Use `mokup/server/worker` instead of `mokup/server` to avoid Node-only dependencies.

## Playground shows no data

Check that:

- The Vite plugin is enabled.
- The path is `/_mokup` (or your custom path).
- Mock filenames include method suffixes.

## Can JSON contain comments?

Yes. Use `.jsonc` for comments and trailing commas.
