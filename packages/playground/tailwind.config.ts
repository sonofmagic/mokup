import type { Config } from 'tailwindcss'
import { addDynamicIconSelectors } from '@iconify/tailwind'

export default {
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx,js,jsx}',
  ],
  plugins: [
    addDynamicIconSelectors({
      prefix: 'i',
    }),
  ],
} satisfies Config
