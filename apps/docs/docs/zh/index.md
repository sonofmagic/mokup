---
layout: home
title: Mokup
description: 面向 Vite、Node 与 Worker 的文件式 HTTP 框架，统一路由与运行时，兼顾 Mock 与真实 API。
hero:
  name: Mokup
  text: 面向项目全周期的文件式 HTTP 框架
  tagline: 统一文件路由、运行时、Server 适配器与 Worker 输出，从 Mock 到真实 API 一路复用。
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/getting-started/quick-start
    - theme: alt
      text: CLI 参考
      link: /zh/reference/cli
features:
  - title: 文件即路由
    details: 通过文件名和目录结构生成路由，支持动态参数与可选段。
  - title: 统一运行时
    details: 运行时与 Server 适配器共享规则，开发与部署一致。
  - title: 多端输出
    details: 本地 Vite、Node 中间件、Cloudflare Worker 都能复用同一套 manifest。
  - title: 自带 Playground
    details: 提供 UI 面板快速浏览、调试与热更新接口。
---

# Mokup 文档

Mokup 是一套以“文件即路由”为核心的 HTTP 框架，覆盖 Vite 本地开发、Node 中间件与 Worker 部署。你可以先用 mock 验证接口，再逐步演进为真实 API，路由与运行时保持一致。

建议从“快速开始”进入。
