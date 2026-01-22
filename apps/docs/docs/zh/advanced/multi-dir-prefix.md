# 多目录与前缀

Vite 插件支持多个目录与前缀组合，适合拆分多套 mock：

```ts
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    mokup({
      entries: [
        { dir: 'mock', prefix: '/api' },
        { dir: 'mock-extra', prefix: '/api-extra' },
        { dir: 'mock-ignored', prefix: '/api-ignored', watch: false },
      ],
    }),
  ],
})
```

说明：

- `dir` 可为单个字符串或数组。
- `prefix` 会自动规范化（确保前导 `/`）。
- 多个目录会被合并到同一个路由表里。

CLI 构建时建议按目录分别生成 `.mokup`，再在运行时自行组合。
