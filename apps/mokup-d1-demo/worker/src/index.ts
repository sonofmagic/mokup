import { createRuntimeApp } from 'mokup/runtime'
import mokupBundle from 'virtual:mokup-bundle'

const appPromise = createRuntimeApp(mokupBundle)

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    const app = await appPromise
    return app.fetch(request, env, ctx)
  },
}
