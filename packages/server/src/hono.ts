import type { ServerOptions } from './types'
import { createFetchHandler } from './fetch'

interface HonoContextLike {
  req: {
    raw: Request
  }
}

type HonoNext = () => Promise<Response | void>

type HonoMiddleware = (
  context: HonoContextLike,
  next: HonoNext,
) => Promise<Response | void>

interface HonoRouteLike {
  basePath: string
  path: string
  method: string
  handler: HonoMiddleware
}

export function createHonoMiddleware(
  options: ServerOptions,
) {
  const handler = createFetchHandler(options)

  const middleware: HonoMiddleware = async (context, next) => {
    const response = await handler(context.req.raw)
    if (!response) {
      return await next()
    }
    return response
  }

  const route: HonoRouteLike = {
    basePath: '',
    path: '*',
    method: 'ALL',
    handler: middleware,
  }

  const bridge = middleware as HonoMiddleware & {
    routes: HonoRouteLike[]
  }
  bridge.routes = [route]

  return bridge
}
