import type { RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const rule: RouteRule = {
  handler: () => `OK - ${faker.word.adjective()}`,
}

export default rule
