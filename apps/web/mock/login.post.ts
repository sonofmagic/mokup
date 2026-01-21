import type { RequestHandler, RouteRule } from 'mokup'

const handler: RequestHandler = async (c) => {
  await new Promise(resolve => setTimeout(resolve, 150))
  const payload = await c.req.json().catch(() => ({}))
  const body = payload && typeof payload === 'object' ? payload : {}
  const username = (body as { username?: string }).username
  const password = (body as { password?: string }).password
  if (username === 'mokup' && password === '123456') {
    return {
      ok: true,
      message: 'Access granted. Welcome to the mock channel.',
      token: 'mock-token-7d91',
    }
  }
  c.status(401)
  return {
    ok: false,
    message: 'Invalid credentials.',
    hint: 'Try mokup / 123456',
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
