import type { DefaultTheme } from 'vitepress'

export const zhSidebar: DefaultTheme.Sidebar = {
  '/getting-started/': [
    {
      text: '开始使用',
      items: [
        { text: '项目概览', link: '/getting-started/overview' },
        { text: '安装', link: '/getting-started/installation' },
        { text: '快速开始', link: '/getting-started/quick-start' },
      ],
    },
  ],
  '/core-concepts/': [
    {
      text: '核心概念',
      items: [
        { text: '文件路由', link: '/core-concepts/file-routing' },
        { text: 'Mock 规则', link: '/core-concepts/mock-rules' },
        { text: '函数处理器', link: '/core-concepts/handlers' },
        { text: 'Manifest', link: '/core-concepts/manifest' },
      ],
    },
  ],
  '/advanced/': [
    {
      text: '进阶',
      items: [
        { text: '多目录与前缀', link: '/advanced/multi-dir-prefix' },
        { text: 'Playground', link: '/advanced/playground' },
        { text: '热更新与调试', link: '/advanced/hot-reload' },
      ],
    },
  ],
  '/deploy/': [
    {
      text: '部署',
      items: [
        { text: 'Vite 构建产物', link: '/deploy/vite-build' },
        { text: 'Cloudflare Worker', link: '/deploy/cloudflare-worker' },
      ],
    },
  ],
  '/reference/': [
    {
      text: '参考',
      items: [
        { text: 'CLI', link: '/reference/cli' },
        { text: 'Vite 插件', link: '/reference/vite-plugin' },
        { text: 'Server 适配器', link: '/reference/server' },
        { text: 'Runtime API', link: '/reference/runtime' },
        { text: 'Manifest 结构', link: '/reference/manifest-schema' },
        { text: '常见问题', link: '/reference/faq' },
      ],
    },
  ],
}

export const enSidebar: DefaultTheme.Sidebar = {
  '/en/getting-started/': [
    {
      text: 'Getting Started',
      items: [
        { text: 'Overview', link: '/en/getting-started/overview' },
        { text: 'Installation', link: '/en/getting-started/installation' },
        { text: 'Quick Start', link: '/en/getting-started/quick-start' },
      ],
    },
  ],
  '/en/core-concepts/': [
    {
      text: 'Core Concepts',
      items: [
        { text: 'File Routing', link: '/en/core-concepts/file-routing' },
        { text: 'Mock Rules', link: '/en/core-concepts/mock-rules' },
        { text: 'Handlers', link: '/en/core-concepts/handlers' },
        { text: 'Manifest', link: '/en/core-concepts/manifest' },
      ],
    },
  ],
  '/en/advanced/': [
    {
      text: 'Advanced',
      items: [
        { text: 'Multi-Dir & Prefix', link: '/en/advanced/multi-dir-prefix' },
        { text: 'Playground', link: '/en/advanced/playground' },
        { text: 'Hot Reload & Debug', link: '/en/advanced/hot-reload' },
      ],
    },
  ],
  '/en/deploy/': [
    {
      text: 'Deploy',
      items: [
        { text: 'Vite Build Output', link: '/en/deploy/vite-build' },
        { text: 'Cloudflare Worker', link: '/en/deploy/cloudflare-worker' },
      ],
    },
  ],
  '/en/reference/': [
    {
      text: 'Reference',
      items: [
        { text: 'CLI', link: '/en/reference/cli' },
        { text: 'Vite Plugin', link: '/en/reference/vite-plugin' },
        { text: 'Server Adapters', link: '/en/reference/server' },
        { text: 'Runtime API', link: '/en/reference/runtime' },
        { text: 'Manifest Schema', link: '/en/reference/manifest-schema' },
        { text: 'FAQ', link: '/en/reference/faq' },
      ],
    },
  ],
}
