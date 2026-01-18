# Manifest

CLI builds output `.mokup/mokup.manifest.json` and `.mokup/mokup.manifest.mjs`, describing all routes and rules.

Core shape (simplified):

```json
{
  "version": 1,
  "routes": [
    {
      "method": "GET",
      "url": "/users",
      "tokens": [],
      "score": [],
      "source": "mock/users.get.json",
      "response": { "type": "json", "body": [] }
    }
  ]
}
```

When `response.type` is `module`, it points to a bundled handler:

```json
{
  "type": "module",
  "module": "./mokup-handlers/mock/users.get.mjs",
  "ruleIndex": 0
}
```

`mokup.bundle.mjs` combines the manifest and handler module map for easy runtime usage.
