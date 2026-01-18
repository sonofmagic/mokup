import type { DefaultTheme } from 'vitepress'

export const zhNav: DefaultTheme.NavItem[] = [
  { text: '开始使用', link: '/getting-started/overview' },
  { text: '核心概念', link: '/core-concepts/file-routing' },
  { text: '进阶', link: '/advanced/multi-dir-prefix' },
  { text: '部署', link: '/deploy/vite-build' },
  { text: 'Playground', link: '/playground' },
  { text: '参考', link: '/reference/cli' },
]

export const enNav: DefaultTheme.NavItem[] = [
  { text: 'Getting Started', link: '/en/getting-started/overview' },
  { text: 'Core Concepts', link: '/en/core-concepts/file-routing' },
  { text: 'Advanced', link: '/en/advanced/multi-dir-prefix' },
  { text: 'Deploy', link: '/en/deploy/vite-build' },
  { text: 'Playground', link: '/playground' },
  { text: 'Reference', link: '/en/reference/cli' },
]
