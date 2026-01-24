<p align="center">
  <img src="docs/assets/mokup-logo.svg" width="180" alt="Mokup logo">
</p>
<h1 align="center">mokup</h1>
<p align="center">File-based mock toolkit for Vite, CLI builds, and runtime usage.</p>
<p align="center">
  <a href="http://mokup.icebreaker.top/">Website</a> ·
  <a href="http://mokup.icebreaker.top/__mokup">Playground</a> ·
  <a href="https://github.com/sonofmagic/mokup">GitHub</a>
</p>

## Why mokup

- File-based routing via filename suffixes like `users.get.json`.
- JSON/JSONC and TS/JS handlers powered by Hono Context.
- Works in Vite dev, CLI builds (workers), and runtime adapters.
- Built-in headers, status, delays, and middleware hooks.

## Quick start

Create `mock/users.get.json`:

```json
{ "ok": true }
```

Create `mock/login.post.ts`:

```ts
export default async (c) => {
  const body = await c.req.json().catch(() => ({}))
  return { ok: true, user: body }
}
```

Follow the docs at http://mokup.icebreaker.top/ for Vite and CLI setup.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Contributors

Thanks to [all contributors](https://github.com/sonofmagic/mokup/graphs/contributors)!

## Authors

ice breaker <1324318532@qq.com>

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
