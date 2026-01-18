# 热更新与调试

Mokup 在 Vite dev 中会监听 mock 目录的文件变化，并自动刷新路由表。

## 开启/关闭监听

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      dir: 'mock',
      watch: true,
    }),
  ],
}
```

若不需要监听（例如预览环境），可设 `watch: false`。

## 调试建议

- 路由变化后 Playground 会自动刷新（`mokup:routes-changed`）。
- 若某个接口不生效，请先检查文件名是否包含 method 后缀。
- TS 处理器支持 `console.log` 输出，Vite dev 会显示日志。
