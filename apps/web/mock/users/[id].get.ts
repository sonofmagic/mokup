import type { RequestHandler, RouteRule } from 'mokup'

const handler: RequestHandler = (c) => {
  const id = c.req.param('id')
  return {
    ok: true,
    id,
    params: c.req.param() ?? {},
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
