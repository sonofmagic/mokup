import type { RequestHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  const rawSlug = c.req.param('slug')
  const slug = Array.isArray(rawSlug)
    ? rawSlug
    : typeof rawSlug === 'string' && rawSlug.length > 0
      ? rawSlug.split('/').filter(Boolean)
      : []
  const url = new URL(c.req.url, 'http://mokup.local')
  const query = Object.fromEntries(url.searchParams.entries())
  return {
    slug,
    query,
  }
}

export default handler
