# llms.txt

`llms.txt` 是面向 LLM 的轻量索引，帮助模型快速理解文档结构与关键概念，
无需你手动粘贴整站内容。

## 访问位置

VitePress 构建时会生成两份面向 LLM 的文件：

- https://mokup.icebreaker.top/llms.txt
- https://mokup.icebreaker.top/llms-full.txt

## 使用方式

- 将链接提供给 LLM，让它先读取再回答问题。
- 结合 AI 提示词页面使用，提升生成响应的准确性。

## llms-full.txt

`/llms-full.txt` 会把全部文档合并成单文件，适合让模型做全量检索。

## 示例提示词

```text
阅读 https://mokup.icebreaker.top/llms.txt ，列出学习 Mokup 在 Cloudflare
部署的最佳文档页面。
```

```text
使用 https://mokup.icebreaker.top/llms-full.txt 作为上下文，说明如何用
mokup/server/worker 创建 Worker 入口。
```

## 更新时机

`llms.txt` 会在每次文档构建时重新生成，更新文档后重新构建即可同步。

## 相关链接

- [AI 提示词](./)
