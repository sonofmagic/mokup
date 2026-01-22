import type { RequestHandler, RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  const fallbackId = faker.string.uuid()
  const rawId = c.req.param('id') ?? fallbackId
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  return {
    ok: true,
    id,
    name: faker.person.fullName(),
    params: c.req.param() ?? {},
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
