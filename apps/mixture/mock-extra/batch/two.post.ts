import type { RouteRule } from 'mokup'

const rule: RouteRule = {
  handler: async (c) => {
    const body = await c.req.json().catch(() => null)
    return {
      ok: true,
      lane: 'two',
      received: body,
    }
  },
}

export default rule
