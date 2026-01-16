import type { MockResponseHandler, MockRule } from 'mokup'

const handler: MockResponseHandler = (req) => {
  const slug = Array.isArray(req.params?.slug) ? req.params?.slug : []
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
