import type { MockRule } from 'mokup'
import { Buffer } from 'node:buffer'

const rule: MockRule = {
  url: '/binary',
  method: 'get',
  headers: {
    'Content-Type': 'application/octet-stream',
    'x-mokup-binary': '1',
  },
  response: Buffer.from('MOKU_BINARY_PAYLOAD'),
}

export default rule
