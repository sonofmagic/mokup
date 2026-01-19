import type { DefaultTheme } from 'vitepress'

export const zhNav: DefaultTheme.NavItem[] = [
  { text: '开始使用', link: '/zh/getting-started/overview' },
  { text: '核心概念', link: '/zh/core-concepts/file-routing' },
  { text: '进阶', link: '/zh/advanced/multi-dir-prefix' },
  { text: 'AI 提示词', link: '/zh/ai/' },
  { text: '部署', link: '/zh/deploy/vite-build' },
  {
    text: 'Playground',
    link: '/_mokup/',
    target: '_blank',
    rel: 'noreferrer',
  },
  { text: '参考', link: '/zh/reference/cli' },
]

export const enNav: DefaultTheme.NavItem[] = [
  { text: 'Getting Started', link: '/getting-started/overview' },
  { text: 'Core Concepts', link: '/core-concepts/file-routing' },
  { text: 'Advanced', link: '/advanced/multi-dir-prefix' },
  { text: 'AI Prompts', link: '/ai/' },
  { text: 'Deploy', link: '/deploy/vite-build' },
  {
    text: 'Playground',
    link: '/_mokup/',
    target: '_blank',
    rel: 'noreferrer',
  },
  { text: 'Reference', link: '/reference/cli' },
]
