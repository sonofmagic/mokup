import type { MokupServerOptions } from 'mokup/server'
import { Hono } from 'hono'
import { createHonoMiddleware } from 'mokup/server'
import mokupBundle from './.mokup/mokup.bundle.mjs'

const app = new Hono()

const options: MokupServerOptions = {
  manifest: mokupBundle.manifest,
  onNotFound: 'response',
}
if (typeof mokupBundle.moduleBase !== 'undefined') {
  options.moduleBase = mokupBundle.moduleBase
}
if (typeof mokupBundle.moduleMap !== 'undefined') {
  options.moduleMap = mokupBundle.moduleMap
}

app.use(createHonoMiddleware(options))

export default app
