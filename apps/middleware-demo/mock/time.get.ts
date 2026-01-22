import type { RouteRule } from 'mokup'

const rule: RouteRule = {
  handler: () => ({
    now: new Date().toISOString(),
    source: 'mokup-middleware-demo',
  }),
}

export default rule
