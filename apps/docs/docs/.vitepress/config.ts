import type { DefaultTheme } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'
import mokup from 'mokup/vite'
import { defineConfig } from 'vitepress'
import { enNav, zhNav } from './config/nav'
import { enSidebar, zhSidebar } from './config/sidebar'

const themeConfig: DefaultTheme.Config = {
  socialLinks: [
    { icon: 'github', link: 'https://github.com/sonofmagic/mokup' },
  ],
  nav: enNav,
  sidebar: enSidebar,
  outlineTitle: 'On this page',
}

const vitePlugins = [
  tailwindcss(),
  mokup({
    dir: '../mock',
    prefix: '/api',
    mode: 'sw',
    sw: {
      fallback: false,
    },
    playground: {
      path: '/_mokup',
    },
  }),
] as unknown as any[]

export default defineConfig({
  title: 'Mokup',
  description: 'Mock utilities for Vite, Node adapters, and Workers.',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,
  vite: {
    plugins: vitePlugins,
  },
  locales: {
    root: { label: 'English', lang: 'en-US' },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: zhNav,
        sidebar: zhSidebar,
        outlineTitle: '本页目录',
      },
    },
  },
  themeConfig,
})
