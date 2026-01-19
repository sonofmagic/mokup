import type { MockResponseHandler, MockRule } from 'mokup'

const handler: MockResponseHandler = (c) => {
  const slugValue = c.req.param('slug')
  const slug = slugValue ? slugValue.split('/') : []
  return {
    ok: true,
    slug,
    trail: slug.join('/'),
  }
}

const rule: MockRule = {
  response: handler,
}

export default rule
