import mokup from 'mokup/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    mokup({
      dir: 'mock',
      prefix: '/api',
      mode: 'sw',
      sw: {
        register: false,
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
  ],
})
