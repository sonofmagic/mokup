import type { MockRule } from 'mokup'

const rule: MockRule = {
  url: '/login',
  method: 'post',
  response: async (req, res, ctx) => {
    await ctx.delay(150)
    const payload = (req.body ?? {}) as { username?: string, password?: string }
    if (payload.username === 'mokup' && payload.password === '123456') {
      return {
        ok: true,
        message: 'Access granted. Welcome to the mock channel.',
        token: 'mock-token-7d91',
      }
    }
    res.statusCode = 401
    return {
      ok: false,
      message: 'Invalid credentials.',
      hint: 'Try mokup / 123456',
    }
  },
}

export default rule
