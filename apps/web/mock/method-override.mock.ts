import type { MockRule } from 'mokup'

const rule: MockRule = {
  method: 'patch',
  response: {
    ok: true,
    message: 'Method overridden by rule.method.',
  },
}

export default rule
