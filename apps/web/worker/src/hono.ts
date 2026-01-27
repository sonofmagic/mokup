import { Hono } from 'hono'
import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from 'virtual:mokup-bundle'

const handler = createFetchHandler({
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: mokupBundle.moduleBase,
})

const app = new Hono()

app.get('/health', c => c.text('ok'))
app.use('*', async (c, next) => {
  const response = await handler(c.req.raw)
  if (response) {
    return response
  }
  return next()
})

export default app
