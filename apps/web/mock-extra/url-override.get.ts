import type { MockRule } from 'mokup'

const rule: MockRule = {
  url: '/override/target',
  response: {
    ok: true,
    source: 'url override',
  },
}

export default rule
