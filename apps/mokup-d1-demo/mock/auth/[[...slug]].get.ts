import type { RequestHandler, RouteRule } from 'mokup'

const handler: RequestHandler = (c) => {
  const auth = c.get('auth')
  if (!auth) {
    return c.json({ error: 'Auth is not configured.' }, 500)
  }
  return auth.handler(c.req.raw)
}

const rule: RouteRule = {
  handler,
}

export default rule
