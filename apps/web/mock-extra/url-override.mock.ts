import type { MockRule } from 'moku'

const rule: MockRule = {
  url: '/override/target',
  response: {
    ok: true,
    source: 'url override',
  },
}

export default rule
