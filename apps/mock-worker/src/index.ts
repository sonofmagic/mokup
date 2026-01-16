import { createMokuHonoApp } from 'moku-hono'
import manifest from './.moku/moku.manifest.json' assert { type: 'json' }

const app = createMokuHonoApp({
  manifest,
  moduleBase: new URL('./.moku/', import.meta.url),
  onNotFound: 'response',
})

export default app
