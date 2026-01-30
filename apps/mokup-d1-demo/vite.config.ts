import process from 'node:process'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'
import { getMokupViteAliases } from '../../scripts/mokup-alias.mjs'

const isE2E = process.env.E2E === '1'

export default defineConfig({
  optimizeDeps: isE2E ? { noDiscovery: true, entries: [] } : undefined,
  resolve: {
    alias: getMokupViteAliases(),
  },
  plugins: [
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
  ],
})
