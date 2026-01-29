import mokup from 'mokup/vite'
import { defineConfig } from 'vite'
import { getMokupViteAliases } from '../../scripts/mokup-alias.mjs'

export default defineConfig({
  resolve: {
    alias: getMokupViteAliases(),
  },
  plugins: [
    mokup({
      entries: {
        dir: 'mock',
        prefix: '/api',
        mode: 'sw',
      },
    }),
  ],
})
