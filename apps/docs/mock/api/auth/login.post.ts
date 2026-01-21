import type { MockResponseHandler } from 'mokup'

const handler: MockResponseHandler = async (c) => {
  const payload = await c.req.json().catch(() => ({}))
  const body = payload && typeof payload === 'object' ? payload : {}
  const username = (body as { username?: string }).username
  const password = (body as { password?: string }).password
  if (username !== 'demo' || password !== 'mokup') {
    c.status(401)
    return {
      ok: false,
      error: 'invalid_credentials',
    }
  }
  return {
    token: 'mokup-demo-token',
    expiresIn: 3600,
    user: {
      id: 'usr_1001',
      name: 'Demo User',
      email: 'demo@example.com',
    },
  }
}

export default handler
