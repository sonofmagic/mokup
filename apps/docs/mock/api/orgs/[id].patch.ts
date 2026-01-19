import type { DocsMockResponseHandler } from '../../types'

const handler: DocsMockResponseHandler = (req) => {
  const rawId = req.params?.id ?? 'org_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Org ${id}`
  const defaults = {
    domain: 'example.com',
    plan: 'pro',
    membersCount: 12,
  }
  return {
    ok: true,
    data: {
      id,
      name: displayValue,
      status: 'active',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      ...defaults,
    },
  }
}

export default handler
