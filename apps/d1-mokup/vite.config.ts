import { cloudflare } from '@cloudflare/vite-plugin'
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
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
