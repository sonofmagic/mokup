import type { MockRequest, MockResponseHandler, MockRule } from 'mokup'

const handler: MockResponseHandler = (req: MockRequest) => {
  const slugValue = req.params ? req.params.slug : undefined
  const slug = Array.isArray(slugValue)
    ? slugValue
    : typeof slugValue === 'string'
      ? [slugValue]
      : []
  return {
    ok: true,
    slug,
    empty: slug.length === 0,
  }
}

const rule: MockRule = {
  response: handler,
}

export default rule
