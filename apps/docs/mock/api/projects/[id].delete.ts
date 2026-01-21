import type { MockResponseHandler } from 'mokup'

const handler: MockResponseHandler = (c) => {
  const rawId = c.req.param('id') ?? 'prj_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  return {
    ok: true,
    id,
  }
}

export default handler
