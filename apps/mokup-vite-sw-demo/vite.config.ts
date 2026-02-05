import type { PluginOption } from 'vite'
import process from 'node:process'
import vue from '@vitejs/plugin-vue'
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'
import { getMokupViteAliases } from '../../scripts/mokup-alias.mjs'

const isE2E = process.env.E2E === '1'

const plugins = [
  vue(),
  mokup({
    entries: {
      dir: 'mock',
      prefix: '/api',
      mode: 'sw',
    },
  }),
] as PluginOption[]

export default defineConfig({
  ...(isE2E ? { optimizeDeps: { noDiscovery: true, entries: [] } } : {}),
  resolve: {
    alias: getMokupViteAliases(),
  },
  plugins,
})
