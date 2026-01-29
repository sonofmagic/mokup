import type { RequestHandler, RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = (c) => {
  const slugValue = c.req.param('slug')
  const fallbackSlug = faker.helpers.slugify(faker.company.catchPhrase())
  const slug = slugValue ? slugValue.split('/') : fallbackSlug.split('-')
  return {
    ok: true,
    slug,
    empty: slug.length === 0,
    title: faker.company.name(),
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
