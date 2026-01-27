import { createFetchHandler } from 'mokup/server/fetch'
import mokupBundle from 'virtual:mokup-bundle'

const handler = createFetchHandler({
  manifest: mokupBundle.manifest,
  moduleMap: mokupBundle.moduleMap,
  moduleBase: mokupBundle.moduleBase,
})

export default {
  fetch: async (request: Request) => {
    const url = new URL(request.url)
    if (url.pathname === '/health') {
      return new Response('ok')
    }
    return (await handler(request)) ?? new Response('Not Found', { status: 404 })
  },
}
