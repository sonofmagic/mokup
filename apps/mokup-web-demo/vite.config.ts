import type { PluginOption } from 'vite'
import process from 'node:process'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'
import { getMokupViteAliases } from '../../scripts/mokup-alias.mjs'

const isE2E = process.env.E2E === '1'

const plugins = [
  vue(),
  tailwindcss(),
  cloudflare(),
  mokup({
    runtime: 'worker',
    entries: [
      {
        dir: 'mock',
        prefix: '/api',
        exclude: [/\/mock\/_ignored\//],
      },
      {
        dir: 'mock-extra',
        prefix: '/api-extra',
      },
      {
        dir: 'mock-ignored',
        prefix: '/api-ignored',
      },
    ],
  }),
] as PluginOption[]

export default defineConfig({
  ...(isE2E ? { optimizeDeps: { noDiscovery: true, entries: [] } } : {}),
  resolve: {
    alias: getMokupViteAliases(),
  },
  plugins,
})
