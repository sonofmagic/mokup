import type { RequestHandler, RouteRule } from 'mokup'

const handler: RequestHandler = (c) => {
  const slugValue = c.req.param('slug')
  const slug = slugValue ? slugValue.split('/') : []
  return {
    ok: true,
    slug,
    empty: slug.length === 0,
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
