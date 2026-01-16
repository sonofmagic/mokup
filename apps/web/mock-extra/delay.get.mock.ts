import type { MockRule } from 'moku'

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
