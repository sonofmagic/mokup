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
    response: req => ({
      ok: true,
      lane: 'two',
      received: req.body ?? null,
    }),
  },
]

export default rules
