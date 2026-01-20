import type { DefaultTheme } from 'vitepress'

export const zhSidebar: DefaultTheme.Sidebar = {
  '/zh/': [
    {
      text: '开始使用',
      collapsed: false,
      items: [
        { text: '项目概览', link: '/zh/getting-started/overview' },
        { text: '安装', link: '/zh/getting-started/installation' },
        { text: '快速开始', link: '/zh/getting-started/quick-start/' },
        { text: 'Vite 快速开始', link: '/zh/getting-started/quick-start/vite' },
        { text: 'Webpack 快速开始', link: '/zh/getting-started/quick-start/webpack' },
        { text: 'Node.js API', link: '/zh/getting-started/node-api' },
        { text: '服务端中间件', link: '/zh/getting-started/server-middleware' },
      ],
    },
    {
      text: '核心概念',
      collapsed: false,
      items: [
        { text: '文件路由', link: '/zh/core-concepts/file-routing' },
        { text: 'Mock 规则', link: '/zh/core-concepts/mock-rules' },
        { text: '函数处理器', link: '/zh/core-concepts/handlers' },
        { text: 'Manifest', link: '/zh/core-concepts/manifest' },
      ],
    },
    {
      text: '进阶',
      collapsed: false,
      items: [
        { text: '多目录与前缀', link: '/zh/advanced/multi-dir-prefix' },
        { text: 'Playground', link: '/zh/advanced/playground' },
        { text: '热更新与调试', link: '/zh/advanced/hot-reload' },
      ],
    },
    {
      text: '部署',
      collapsed: false,
      items: [
        { text: 'Vite 构建产物', link: '/zh/deploy/vite-build' },
        { text: 'Cloudflare Worker', link: '/zh/deploy/cloudflare-worker' },
      ],
    },
  ],
}

export const enSidebar: DefaultTheme.Sidebar = {
  '/': [
    {
      text: 'Getting Started',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/getting-started/overview' },
        { text: 'Installation', link: '/getting-started/installation' },
        { text: 'Quick Start', link: '/getting-started/quick-start/' },
        { text: 'Vite Quick Start', link: '/getting-started/quick-start/vite' },
        { text: 'Webpack Quick Start', link: '/getting-started/quick-start/webpack' },
        { text: 'Node.js API', link: '/getting-started/node-api' },
        { text: 'Server Middleware', link: '/getting-started/server-middleware' },
      ],
    },
    {
      text: 'Core Concepts',
      collapsed: false,
      items: [
        { text: 'File Routing', link: '/core-concepts/file-routing' },
        { text: 'Mock Rules', link: '/core-concepts/mock-rules' },
        { text: 'Handlers', link: '/core-concepts/handlers' },
        { text: 'Manifest', link: '/core-concepts/manifest' },
      ],
    },
    {
      text: 'Advanced',
      collapsed: false,
      items: [
        { text: 'Multi-Dir & Prefix', link: '/advanced/multi-dir-prefix' },
        { text: 'Playground', link: '/advanced/playground' },
        { text: 'Hot Reload & Debug', link: '/advanced/hot-reload' },
      ],
    },
    {
      text: 'Deploy',
      collapsed: false,
      items: [
        { text: 'Vite Build Output', link: '/deploy/vite-build' },
        { text: 'Cloudflare Worker', link: '/deploy/cloudflare-worker' },
      ],
    },
  ],
}
