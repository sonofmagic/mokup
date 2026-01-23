import type { RouteRule } from 'mokup'

const rule: RouteRule = {
  enabled: false,
  handler: (c) => {
    return {
      ok: false,
      reason: 'disabled-rule',
      method: c.req.method,
    }
  },
}

export default rule
