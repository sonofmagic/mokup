import type { PluginOption } from 'vite'
import process from 'node:process'
import vue from '@vitejs/plugin-vue'
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { getMokupViteAliases } from '../../scripts/mokup-alias.mjs'

const isE2E = process.env.E2E === '1'

const plugins = [
  vue(),
  mokup({
    entries: {
      dir: 'mock',
      prefix: '/api',
      mode: 'sw',
      sw: {
        register: false,
      },
    },
  }),
  VitePWA({
    strategies: 'generateSW',
    injectRegister: 'auto',
    registerType: 'autoUpdate',
    filename: 'sw.js',
    devOptions: {
      enabled: true,
    },
    workbox: {
      importScripts: ['mokup-sw-bridge.js'],
      navigateFallbackDenylist: [/^\/api\//],
      cleanupOutdatedCaches: true,
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
