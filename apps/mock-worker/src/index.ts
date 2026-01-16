import { createMokupHonoApp } from '@mokup/hono'
import manifest from './.mokup/mokup.manifest.json' assert { type: 'json' }

const app = createMokupHonoApp({
  manifest,
  moduleBase: new URL('./.mokup/', import.meta.url),
  onNotFound: 'response',
})

export default app
