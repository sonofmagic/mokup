import type { RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const rule: RouteRule = {
  handler: () => ({
    users: faker.helpers.multiple(
      () => ({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        role: faker.person.jobTitle(),
      }),
      { count: { min: 2, max: 5 } },
    ),
  }),
}

export default rule
