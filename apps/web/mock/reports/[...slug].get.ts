import type { RequestHandler, RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  const slugValue = c.req.param('slug')
  const fallbackSlug = faker.helpers.slugify(faker.commerce.productName())
  const slug = slugValue ? slugValue.split('/') : fallbackSlug.split('-')
  return {
    ok: true,
    slug,
    trail: slug.join('/'),
    title: faker.company.catchPhrase(),
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
