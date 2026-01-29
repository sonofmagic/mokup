import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'
import { defineHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  const fallbackId = faker.string.uuid()
  const rawId = c.req.param('id') ?? fallbackId
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId

  return {
    id,
    name: faker.person.fullName(),
    role: faker.person.jobTitle(),
    email: faker.internet.email(),
    city: faker.location.city(),
  }
}

export default defineHandler(handler)
