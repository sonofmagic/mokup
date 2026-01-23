import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
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
  ],
})
