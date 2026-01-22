import type { RequestHandler, RouteRule } from 'mokup'

const handler: RequestHandler = (c) => {
  return {
    ok: false,
    reason: 'disabled-rule',
    method: c.req.method,
  }
}

const rule: RouteRule = {
  enabled: false,
  handler,
}

export default rule
