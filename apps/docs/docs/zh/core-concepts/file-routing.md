# 文件路由

Mokup 通过文件路径与文件名生成路由，核心规则如下：

## Method 后缀

文件名必须包含 HTTP 方法后缀（`.get`、`.post` 等）：

```
mock/users.get.json   -> GET /users
mock/users.post.ts    -> POST /users
```

在 Vite 插件中，`.json/.jsonc` 如果没有方法后缀，会默认视为 `GET`；在 CLI 构建时建议显式写方法后缀，避免歧义。

## index 路由

`index` 会被视为目录根路径：

```
mock/index.get.json       -> GET /
mock/users/index.get.ts   -> GET /users
```

## 动态参数

使用方括号定义参数：

```
mock/users/[id].get.ts    -> GET /users/:id
```

在处理函数中可以通过 `c.req.param('id')` 访问：

```ts
export default {
  response: c => ({ id: c.req.param('id') }),
}
```

## Catch-all 与可选段

```
mock/docs/[...slug].get.ts   -> /docs/* (至少 1 段)
mock/docs/[[...slug]].get.ts -> /docs (可选)
```

这些规则与前端路由常见语法一致，适合做文档类 API 模拟。
