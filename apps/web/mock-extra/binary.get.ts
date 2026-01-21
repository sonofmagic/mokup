import type { RouteRule } from 'mokup'
import { Buffer } from 'node:buffer'

const rule: RouteRule = {
  headers: {
    'Content-Type': 'application/octet-stream',
    'x-mokup-binary': '1',
  },
  handler: Buffer.from('MOKU_BINARY_PAYLOAD'),
}

export default rule
