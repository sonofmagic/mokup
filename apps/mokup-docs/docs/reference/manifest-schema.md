# Manifest Schema

`mokup.manifest.json` core fields:

Use cases:

- Inspect or validate generated manifests in CI pipelines.
- Produce custom manifests for advanced tooling or testing.

Demo:

```ts
const manifest: Manifest = {
  version: 1,
  routes: [
    {
      method: 'GET',
      url: '/api/ping',
      response: { type: 'text', body: 'ok' },
    },
  ],
}
```

```ts
interface Manifest {
  version: 1
  routes: ManifestRoute[]
}

interface ManifestRoute {
  method: string
  url: string
  tokens?: RouteToken[]
  score?: number[]
  source?: string
  status?: number
  headers?: Record<string, string>
  delay?: number
  middleware?: ManifestModuleRef[]
  response: ManifestResponse
}

interface ManifestModuleRef {
  module: string
  exportName?: string
  ruleIndex?: number
}
```

`ManifestResponse`:

```ts
type ManifestResponse
  = | { type: 'json', body: unknown }
    | { type: 'text', body: string }
    | { type: 'binary', body: string, encoding: 'base64' }
    | ({ type: 'module' } & ManifestModuleRef)
```

`ruleIndex` selects an entry when a module exports an array of rules or middleware. `module` can be a relative path (CLI output) or a Vite module path (SW build).

The CLI generates this for you automatically.
