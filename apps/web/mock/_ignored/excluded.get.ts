import type { MockRule } from 'mokup'

const rule: MockRule = {
  url: '/excluded',
  response: {
    ok: false,
    note: 'This file should be excluded by the plugin.',
  },
}

export default rule
