import type { RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const rule: RouteRule = {
  handler: () => ({
    now: faker.date.recent({ days: 7 }).toISOString(),
    source: 'mokup-middleware-demo',
  }),
}

export default rule
