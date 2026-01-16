import type { MockRule } from 'mokup'

const rule: MockRule = {
  url: '/delay',
  method: 'get',
  delay: 900,
  response: {
    ok: true,
    message: 'Simulated slow response.',
  },
}

export default rule
