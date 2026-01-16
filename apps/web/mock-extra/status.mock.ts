import type { MockRule } from 'mokup'

const rule: MockRule = {
  url: '/status/accepted',
  method: 'get',
  status: 202,
  headers: {
    'x-mokup-region': 'delta',
    'x-mokup-trace': 'mokup-202',
  },
  response: {
    ok: true,
    message: 'Accepted for processing.',
  },
}

export default rule
