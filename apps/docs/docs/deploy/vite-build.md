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
