import type { DocsMockResponseHandler } from '../../types'

const handler: DocsMockResponseHandler = (req) => {
  const rawId = req.params?.id ?? 'med_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  return {
    ok: true,
    id,
  }
}

export default handler
