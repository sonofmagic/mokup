import type { RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const rule: RouteRule = {
  handler: () => ({
    ok: true,
    service: 'webpack-demo',
    checkedAt: faker.date.recent({ days: 3 }).toISOString(),
    region: faker.location.countryCode(),
  }),
}

export default rule
