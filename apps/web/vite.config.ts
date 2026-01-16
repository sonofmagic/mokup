import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import moku from 'moku/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    moku({
      dir: ['mock', 'mock-extra', 'mock-ignored'],
      include: [/\/mock\//, /\/mock-extra\//],
      exclude: [/\.disabled\./],
    }),
  ],
})
