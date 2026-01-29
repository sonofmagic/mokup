import type { RequestHandler, RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = async (c) => {
  const body = await c.req.json().catch(() => null)
  return {
    ok: true,
    requestId: faker.string.uuid(),
    received: body ?? {
      message: faker.lorem.sentence(),
    },
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
