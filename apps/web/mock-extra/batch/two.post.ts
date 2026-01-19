import type { MockRule } from 'mokup'

const rule: MockRule = {
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
