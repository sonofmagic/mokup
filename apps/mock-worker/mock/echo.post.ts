import type { RequestHandler, RouteRule } from 'mokup'

const handler: RequestHandler = async (c) => {
  const body = await c.req.json().catch(() => null)
  return {
    ok: true,
    received: body,
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
