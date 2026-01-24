import type { DefaultTheme } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'
import mokup from 'mokup/vite'
import { defineConfig } from 'vitepress'
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'
import llmstxt from 'vitepress-plugin-llms'
import { enNav, zhNav } from './config/nav'
import { enSidebar, zhSidebar } from './config/sidebar'

const siteTitle = 'Mokup'
const siteTagline = 'File-based HTTP framework for Vite, Node, and Workers'
const siteDescription
  = 'Build file-driven HTTP routes with a unified runtime, serving mock or real APIs across dev and deployment.'
const siteUrl = 'https://mokup.icebreaker.top'
const ogImage = `${siteUrl}/brand/mokup-logo.svg`

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
    entries: {
      dir: '../mock',
      prefix: '/api',
      mode: 'sw',
      sw: {
        fallback: false,
      },
    },
    playground: {

    },
  }),
  groupIconVitePlugin(),
  llmstxt(),
] as unknown as any[]

export default defineConfig({
  title: siteTitle,
  description: siteDescription,
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    [
      'meta',
      {
        name: 'keywords',
        content:
          'Mokup, HTTP framework, file-based routing, API, mock, Vite, Node, Worker, middleware, runtime',
      },
    ],
    ['meta', { property: 'og:site_name', content: siteTitle }],
    ['meta', { property: 'og:type', content: 'website' }],
    [
      'meta',
      { property: 'og:title', content: `${siteTitle} — ${siteTagline}` },
    ],
    ['meta', { property: 'og:description', content: siteDescription }],
    ['meta', { property: 'og:url', content: siteUrl }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { property: 'og:locale', content: 'en_US' }],
    ['meta', { property: 'og:locale:alternate', content: 'zh_CN' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    [
      'meta',
      { name: 'twitter:title', content: `${siteTitle} — ${siteTagline}` },
    ],
    ['meta', { name: 'twitter:description', content: siteDescription }],
    ['meta', { name: 'twitter:image', content: ogImage }],
  ],
  vite: {
    plugins: vitePlugins,
  },
  sitemap: {
    hostname: siteUrl,
  },
  locales: {
    root: { label: 'English', lang: 'en-US' },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      description:
        '面向 Vite、Node 与 Worker 的文件式 HTTP 框架，统一运行时，覆盖 Mock 到真实 API 的完整流程。',
      themeConfig: {
        nav: zhNav,
        sidebar: zhSidebar,
        outlineTitle: '本页目录',
      },
    },
  },
  themeConfig,
  markdown: {
    config(md) {
      md.use(groupIconMdPlugin)
    },
  },
})
