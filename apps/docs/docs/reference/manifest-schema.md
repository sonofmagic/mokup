# Manifest Schema

`mokup.manifest.json` core fields:

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
  response: ManifestResponse
}
```

`ManifestResponse`:

```ts
type ManifestResponse
  = | { type: 'json', body: unknown }
    | { type: 'text', body: string }
    | { type: 'binary', body: string, encoding: 'base64' }
    | { type: 'module', module: string, exportName?: string, ruleIndex?: number }
```

The CLI generates this for you automatically.
