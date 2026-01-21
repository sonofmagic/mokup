import type { RequestHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  const rawId = c.req.param('id') ?? 'prj_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const displayValue = `Project ${id}`
  const defaults = {
    key: 'PRJ',
    visibility: 'private',
    repoUrl: 'https://git.example.com/prj',
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
