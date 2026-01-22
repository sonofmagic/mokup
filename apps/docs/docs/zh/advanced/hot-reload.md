# 热更新与调试

Mokup 在 Vite dev 中会监听 mock 目录的文件变化，并自动刷新路由表。

## 开启/关闭监听

```ts
import mokup from 'mokup/vite'

export default {
  plugins: [
    mokup({
      entries: {
        dir: 'mock',
        watch: true,
      },
    }),
  ],
}
```

若不需要监听（例如预览环境），可设 `watch: false`。

## 调试建议

- 路由变化后 Playground 会自动刷新（`mokup:routes-changed`）。
- 若某个接口不生效，请先检查文件名是否包含 method 后缀。
- TS 处理器支持 `console.log` 输出，Vite dev 会显示日志。

## 调试 mock handler 与中间件

mock handler 和目录中间件运行在 Vite 的 Node 侧，请使用 Node 调试器而不是浏览器 DevTools。

### VSCode（推荐）

1. 打开命令面板执行 **Debug: Create JavaScript Debug Terminal**。
2. 在该终端里启动 dev 命令（例如 `pnpm dev --filter <app>`）。
3. 在 `mock/**/*.ts` 或 `mock/**/index.config.ts` 里打断点。

如需 `launch.json`：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Vite Dev (mock debug)",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["dev", "--filter", "<app>"],
  "cwd": "${workspaceFolder}",
  "env": {
    "NODE_OPTIONS": "--enable-source-maps --inspect"
  },
  "autoAttachChildProcesses": true
}
```

### 终端 + Node Inspector

```bash
NODE_OPTIONS="--inspect-brk --enable-source-maps" pnpm dev --filter <app>
```

然后在 VSCode 使用 “Attach to Node”，或打开 `chrome://inspect` 连接。

### 快速确认

- 在 handler 内加入 `debugger;` 或 `console.log`，确认是否被加载。
- 预览环境可能无法使用 Vite dev 调试，建议用 `dev` 命令。
