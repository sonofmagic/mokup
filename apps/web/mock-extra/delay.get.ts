import type { MockRule } from 'mokup'

const rule: MockRule = {
  delay: 900,
  handler: {
    ok: true,
    message: 'Simulated slow response.',
  },
}

export default rule
