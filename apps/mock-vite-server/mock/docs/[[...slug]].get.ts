import type { RequestHandler } from 'mokup'
import { defineHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  const raw = c.req.param('slug')
  const slug = Array.isArray(raw) ? raw : raw ? [raw] : []
  return {
    ok: true,
    slug,
    path: slug.length > 0 ? `/${slug.join('/')}` : '/',
  }
}

export default defineHandler(handler)
