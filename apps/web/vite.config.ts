import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    mokup({
      dir: ['mock', 'mock-extra', 'mock-ignored'],
      include: [/\/mock\//, /\/mock-extra\//],
      exclude: [/\.disabled\./],
    }),
  ],
})
