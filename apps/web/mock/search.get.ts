import type { RequestHandler, RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = async (c) => {
  await new Promise(resolve => setTimeout(resolve, 220))
  const term = c.req.query('q')
  c.header('x-mokup-query', String(term ?? ''))
  const pageText = c.req.query('page')
  const fallbackTerm = faker.word.noun()
  return {
    term: term ?? fallbackTerm,
    page: Number(pageText ?? 1),
    results: faker.helpers.multiple(
      (_, index) => ({
        id: index + 1,
        label: `${term ?? fallbackTerm} ${faker.commerce.productName()}`,
      }),
      { count: { min: 2, max: 6 } },
    ),
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
