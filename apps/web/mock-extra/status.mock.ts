import type { MockRule } from 'moku'

const rule: MockRule = {
  url: '/status/accepted',
  method: 'get',
  status: 202,
  headers: {
    'x-moku-region': 'delta',
    'x-moku-trace': 'moku-202',
  },
  response: {
    ok: true,
    message: 'Accepted for processing.',
  },
}

export default rule
