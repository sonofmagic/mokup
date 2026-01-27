# Bundle

`mokupBundle` is the runtime-ready object that packages everything needed to
execute routes outside of Mokup's dev server. You will see it emitted as
`.mokup/mokup.bundle.mjs` (CLI build) or provided as a virtual module
(`virtual:mokup-bundle`) in Vite.

## Why do we need mokupBundle?

Mokup's dev server can read files and execute handlers directly, but most
production runtimes cannot. Workers and serverless platforms block filesystem
access and expect a single module entry. `mokupBundle` packages the manifest
and handler module references into one object so the runtime can execute the
same routes without local file imports.

## What is inside?

A bundle contains three fields:

- `manifest`: route definitions, responses, and metadata.
- `moduleMap`: a map from module id to module exports for handler modules.
- `moduleBase`: the base path used when resolving handler modules.

Only `manifest` is required. `moduleMap` and `moduleBase` are needed when your
runtime cannot load local files directly (Workers, serverless, or other
sandboxed environments).

## manifest

The manifest is the source of truth for route matching. Each route entry
contains HTTP method, URL template, tokens, and the response definition
(`json`, `text`, `binary`, or `module`).

If you need the exact structure, see the [Manifest](./manifest) page.

## moduleMap

`moduleMap` is a lookup table used when a route response is defined as
`type: "module"`. Each entry maps a module id to the module's exports so the
runtime can call a handler without using filesystem imports.

You typically get this from:

- `.mokup/mokup.bundle.mjs` (CLI build output)
- `virtual:mokup-bundle` (Vite runtime in Worker mode)

## moduleBase

`moduleBase` is the base path used to resolve module ids when the runtime needs
to import handlers. In a CLI bundle it defaults to `./` because handler modules
live under `.mokup/mokup-handlers`.

When you provide a custom bundle, make sure `moduleBase` matches the directory
or URL where the handler modules are hosted.

## Producing a bundle

There are three common ways to generate a bundle:

- CLI: `mokup build` writes `.mokup/mokup.bundle.mjs`.
- Vite: import `virtual:mokup-bundle` when using `mokup/vite`.
- Cross-platform: `buildBundleModule` from `mokup/bundle` returns source
  for a bundle module without touching the filesystem.

## When can I omit moduleMap or moduleBase?

If none of your routes use module-based handlers (for example, all responses are
static JSON or text), you can pass only the manifest.

If you are running in Node and can load files directly, you may omit
`moduleMap` and `moduleBase` as long as the runtime can import the handlers.

## Common pitfalls

- Missing `moduleMap` in Worker runtimes causes module handlers to fail.
- Incorrect `moduleBase` leads to unresolved handler imports.

## Minimal usage

```ts
import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from './.mokup/mokup.bundle.mjs'

const handler = createFetchHandler({
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: mokupBundle.moduleBase,
})
```
