import type { MockRule } from 'mokup'

const rules: MockRule[] = [
  {
    url: '/batch/one',
    method: 'get',
    response: {
      ok: true,
      lane: 'one',
    },
  },
  {
    url: '/batch/two',
    method: 'post',
    response: async (c) => {
      const body = await c.req.json().catch(() => null)
      return {
        ok: true,
        lane: 'two',
        received: body,
      }
    },
  },
]

export default rules
