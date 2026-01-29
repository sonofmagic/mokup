import type { RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const rule: RouteRule = {
  delay: 120,
  handler: () => ({
    users: faker.helpers.multiple(
      () => ({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        role: faker.helpers.arrayElement(['Designer', 'Engineer', 'PM', 'QA']),
      }),
      { count: { min: 3, max: 6 } },
    ),
  }),
}

export default rule
