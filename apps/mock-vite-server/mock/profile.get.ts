import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'
import { defineHandler } from 'mokup'

const handler: RequestHandler = () => {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    role: faker.person.jobTitle(),
    location: faker.location.city(),
    email: faker.internet.email(),
    updatedAt: faker.date.recent({ days: 2 }).toISOString(),
  }
}

export default defineHandler(handler)
