import type { DefaultTheme } from 'vitepress'

export const zhSidebar: DefaultTheme.Sidebar = {
  '/zh/getting-started/': [
    {
      text: '开始使用',
      items: [
        { text: '项目概览', link: '/zh/getting-started/overview' },
        { text: '安装', link: '/zh/getting-started/installation' },
        { text: '快速开始', link: '/zh/getting-started/quick-start/' },
        { text: 'Vite 快速开始', link: '/zh/getting-started/quick-start/vite' },
        { text: 'Webpack 快速开始', link: '/zh/getting-started/quick-start/webpack' },
      ],
    },
  ],
  '/zh/core-concepts/': [
    {
      text: '核心概念',
      items: [
        { text: '文件路由', link: '/zh/core-concepts/file-routing' },
        { text: 'Mock 规则', link: '/zh/core-concepts/mock-rules' },
        { text: '函数处理器', link: '/zh/core-concepts/handlers' },
        { text: 'Manifest', link: '/zh/core-concepts/manifest' },
      ],
    },
  ],
  '/zh/advanced/': [
    {
      text: '进阶',
      items: [
        { text: '多目录与前缀', link: '/zh/advanced/multi-dir-prefix' },
        { text: 'Playground', link: '/zh/advanced/playground' },
        { text: '热更新与调试', link: '/zh/advanced/hot-reload' },
      ],
    },
  ],
  '/zh/ai/': [
    {
      text: 'AI 提示词',
      items: [
        { text: '概览', link: '/zh/ai/' },
        { text: 'DTS 模板', link: '/zh/ai/prompt-templates-dts' },
        { text: 'OpenAPI 模板', link: '/zh/ai/prompt-templates-openapi' },
      ],
    },
  ],
  '/zh/deploy/': [
    {
      text: '部署',
      items: [
        { text: 'Vite 构建产物', link: '/zh/deploy/vite-build' },
        { text: 'Cloudflare Worker', link: '/zh/deploy/cloudflare-worker' },
      ],
    },
  ],
  '/zh/reference/': [
    {
      text: '参考',
      items: [
        { text: 'CLI', link: '/zh/reference/cli' },
        { text: 'Vite 插件', link: '/zh/reference/vite-plugin' },
        { text: 'Webpack 插件', link: '/zh/reference/webpack-plugin' },
        { text: 'Server 适配器', link: '/zh/reference/server' },
        { text: 'Runtime API', link: '/zh/reference/runtime' },
        { text: 'Manifest 结构', link: '/zh/reference/manifest-schema' },
        { text: '常见问题', link: '/zh/reference/faq' },
      ],
    },
  ],
}

export const enSidebar: DefaultTheme.Sidebar = {
  '/getting-started/': [
    {
      text: 'Getting Started',
      items: [
        { text: 'Overview', link: '/getting-started/overview' },
        { text: 'Installation', link: '/getting-started/installation' },
        { text: 'Quick Start', link: '/getting-started/quick-start/' },
        { text: 'Vite Quick Start', link: '/getting-started/quick-start/vite' },
        { text: 'Webpack Quick Start', link: '/getting-started/quick-start/webpack' },
      ],
    },
  ],
  '/core-concepts/': [
    {
      text: 'Core Concepts',
      items: [
        { text: 'File Routing', link: '/core-concepts/file-routing' },
        { text: 'Mock Rules', link: '/core-concepts/mock-rules' },
        { text: 'Handlers', link: '/core-concepts/handlers' },
        { text: 'Manifest', link: '/core-concepts/manifest' },
      ],
    },
  ],
  '/advanced/': [
    {
      text: 'Advanced',
      items: [
        { text: 'Multi-Dir & Prefix', link: '/advanced/multi-dir-prefix' },
        { text: 'Playground', link: '/advanced/playground' },
        { text: 'Hot Reload & Debug', link: '/advanced/hot-reload' },
      ],
    },
  ],
  '/ai/': [
    {
      text: 'AI Prompts',
      items: [
        { text: 'Overview', link: '/ai/' },
        { text: 'DTS Templates', link: '/ai/prompt-templates-dts' },
        { text: 'OpenAPI Templates', link: '/ai/prompt-templates-openapi' },
      ],
    },
  ],
  '/deploy/': [
    {
      text: 'Deploy',
      items: [
        { text: 'Vite Build Output', link: '/deploy/vite-build' },
        { text: 'Cloudflare Worker', link: '/deploy/cloudflare-worker' },
      ],
    },
  ],
  '/reference/': [
    {
      text: 'Reference',
      items: [
        { text: 'CLI', link: '/reference/cli' },
        { text: 'Vite Plugin', link: '/reference/vite-plugin' },
        { text: 'Webpack Plugin', link: '/reference/webpack-plugin' },
        { text: 'Server Adapters', link: '/reference/server' },
        { text: 'Runtime API', link: '/reference/runtime' },
        { text: 'Manifest Schema', link: '/reference/manifest-schema' },
        { text: 'FAQ', link: '/reference/faq' },
      ],
    },
  ],
}
