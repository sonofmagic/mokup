import type { MockRule } from 'moku'

const rule: MockRule = {
  url: '/excluded',
  response: {
    ok: false,
    note: 'This file should be excluded by the plugin.',
  },
}

export default rule
