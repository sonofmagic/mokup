import type { RouteRule } from 'mokup'

const rule: RouteRule = {
  delay: 900,
  handler: {
    ok: true,
    message: 'Simulated slow response.',
  },
}

export default rule
