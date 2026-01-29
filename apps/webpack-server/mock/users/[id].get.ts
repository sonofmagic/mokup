import type { RequestHandler, RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  const fallbackId = faker.string.uuid()
  const rawId = c.req.param('id') ?? fallbackId
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  return {
    id,
    name: id === '42' ? 'Ari Park' : faker.person.fullName(),
    detail: faker.lorem.sentence(),
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
