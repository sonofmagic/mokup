import type { Context, RouteRule } from 'mokup'
import { expectType } from 'tsd'

const rule: RouteRule = {
  handler: (c) => {
    expectType<Context>(c)
    return {
      ok: false,
      reason: 'disabled-rule',
      method: c.req.method,
    }
  },
}

const staticRule: RouteRule = {
  handler: {
    ok: true,
  },
}

expectType<RouteRule>(rule)
expectType<RouteRule>(staticRule)
