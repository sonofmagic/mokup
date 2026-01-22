import type { RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const rule: RouteRule = {
  handler: () => ({
    ok: true,
    message: faker.lorem.sentence(),
  }),
}

export default rule
