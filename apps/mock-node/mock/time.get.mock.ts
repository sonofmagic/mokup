import { faker } from '@faker-js/faker'

const rule = {
  handler: () => ({
    now: faker.date.recent({ days: 14 }).toISOString(),
    timezone: faker.location.timeZone(),
  }),
}

export default rule
