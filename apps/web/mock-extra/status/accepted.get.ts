import type { MockRule } from 'mokup'

const rule: MockRule = {
  status: 202,
  headers: {
    'x-mokup-region': 'delta',
    'x-mokup-trace': 'mokup-202',
  },
  handler: {
    ok: true,
    message: 'Accepted for processing.',
  },
}

export default rule
