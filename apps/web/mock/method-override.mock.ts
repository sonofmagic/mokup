import type { MockRule } from 'moku'

const rule: MockRule = {
  method: 'patch',
  response: {
    ok: true,
    message: 'Method overridden by rule.method.',
  },
}

export default rule
