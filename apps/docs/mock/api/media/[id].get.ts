import type { DocsMockResponseHandler } from '../../types'

const handler: DocsMockResponseHandler = (c) => {
  const rawId = c.req.param('id') ?? 'med_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Media ${id}`
  const defaults = {
    type: 'image',
    url: 'https://cdn.example.com/media.png',
    size: 2048,
  }
  return {
    id,
    name: displayValue,
    status: 'ready',
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-18T12:00:00.000Z',
    ...defaults,
  }
}

export default handler
