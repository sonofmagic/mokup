import type { RequestHandler, RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = async (c) => {
  const body = await c.req.json().catch(() => null)
  return {
    ok: true,
    traceId: faker.string.uuid(),
    received: body ?? {
      sample: faker.lorem.sentence(),
    },
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
