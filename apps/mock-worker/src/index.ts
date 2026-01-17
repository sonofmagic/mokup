import type { MokupHonoOptions } from '@mokup/hono'
import { mokup } from '@mokup/hono'
import { Hono } from 'hono'
import manifest from './.mokup/mokup.manifest.json' assert { type: 'json' }

const app = new Hono()

app.use(mokup({
  manifest: manifest as unknown as MokupHonoOptions['manifest'],
  moduleBase: new URL('./.mokup/', import.meta.url),
  onNotFound: 'response',
}))

export default app
