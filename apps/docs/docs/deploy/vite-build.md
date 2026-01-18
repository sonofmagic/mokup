# Vite Build Output

Generate deployable artifacts with the CLI:

```bash
pnpm exec mokup build --dir mock --out .mokup
```

Output structure:

```
.mokup/
  mokup.manifest.json
  mokup.manifest.mjs
  mokup.manifest.d.mts
  mokup.bundle.mjs
  mokup.bundle.d.ts
  mokup.bundle.d.mts
  mokup-handlers/ (optional)
```

`mokup.bundle.mjs` is the easiest entry for Workers or custom runtimes.
