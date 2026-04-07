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
    entries: {
      dir: 'mock',
      prefix: '/api',
    },
  }),
] as PluginOption[]

export default defineConfig({
  ...(isE2E
    ? {
        optimizeDeps: { noDiscovery: true, entries: [] },
        server: {
          hmr: {
            overlay: false,
          },
        },
      }
    : {}),
  resolve: {
    alias: getMokupViteAliases(),
  },
  plugins,
})
