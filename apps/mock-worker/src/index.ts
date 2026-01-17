import type { MokupServerOptions } from '@mokup/server'
import { createHonoMiddleware } from '@mokup/server'
import { Hono } from 'hono'
import manifest from './.mokup/mokup.manifest.json' assert { type: 'json' }

const app = new Hono()

app.use(createHonoMiddleware({
  manifest: manifest as unknown as MokupServerOptions['manifest'],
  moduleBase: new URL('./.mokup/', import.meta.url),
  onNotFound: 'response',
}))

export default app
