# Vite 构建产物

当需要在构建期生成可部署的 mock 产物时，使用 CLI：

```bash
pnpm exec mokup build --dir mock --out .mokup
```

输出目录结构：

```
.mokup/
  mokup.manifest.json
  mokup.manifest.mjs
  mokup.manifest.d.mts
  mokup.bundle.mjs
  mokup.bundle.d.ts
  mokup.bundle.d.mts
  mokup-handlers/ (可选)
```

`mokup.bundle.mjs` 是最方便的入口文件，适合在 Worker 或自定义运行时中直接导入。

## Service Worker 构建

当在 Vite 插件中设置 `mode: 'sw'` 时，Service Worker 脚本会在 `vite build` 期间输出（默认 `/mokup-sw.js`）。插件会自动注入注册脚本，除非设置 `sw.register: false`。

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      entries: {
        dir: 'mock',
        prefix: '/api',
        mode: 'sw',
        sw: {
          path: '/mokup-sw.js',
          scope: '/',
        },
      },
    }),
  ],
}
```

这种方式适合纯静态部署，因为 mock 请求在浏览器侧处理。如果你还需要 playground，请确保 `/_mokup/routes` 在构建期生成并作为静态 JSON 文件发布（可用 `mokup build` 或脚本生成）。

注意：

- `sw.basePath` 用于控制 SW 拦截的请求路径，默认继承 entry 的 `prefix`。
