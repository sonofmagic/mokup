import type { DocsMockResponseHandler } from '../../types'

const handler: DocsMockResponseHandler = (c) => {
  const rawId = c.req.param('id') ?? 'rev_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  return {
    ok: true,
    id,
  }
}

export default handler
