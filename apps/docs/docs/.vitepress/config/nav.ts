import type { DefaultTheme } from 'vitepress'

export const zhNav: DefaultTheme.NavItem[] = [
  { text: '开始使用', link: '/zh/getting-started/overview' },
  { text: 'AI 提示词', link: '/zh/ai/' },
  { text: '参考', link: '/zh/reference/cli' },
  {
    text: 'Playground',
    link: '/_mokup/',
    target: '_blank',
    rel: 'noreferrer',
  },
]

export const enNav: DefaultTheme.NavItem[] = [
  { text: 'Getting Started', link: '/getting-started/overview' },
  { text: 'AI Prompts', link: '/ai/' },
  { text: 'Reference', link: '/reference/cli' },
  {
    text: 'Playground',
    link: '/_mokup/',
    target: '_blank',
    rel: 'noreferrer',
  },
]
