import type { RequestHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'met_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  return {
    ok: true,
    id,
  }
}

export default handler
