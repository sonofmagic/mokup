# Playground

Playground 是一个内置的可视化面板，用于浏览和调试当前已加载的 mock 接口。

## 默认入口

```
http://localhost:5173/__mokup
```

## 配置入口

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      entries: {
        dir: 'mock',
        prefix: '/api',
      },
      playground: {
        path: '/__mokup',
        enabled: true,
      },
    }),
  ],
}
```

当 `playground: false` 时将禁用。

需要静态部署时，可设置 `playground.build: true`，在 `vite build` 中输出
Playground 资源与 `/__mokup/routes` JSON 到对应路径。

## 功能

- 按目录/分组展示路由
- 查看请求方法、路径与响应类型
- 与 Vite 热更新联动，文件变更会刷新路由
