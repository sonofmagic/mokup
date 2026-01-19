import type { DocsMockResponseHandler } from '../types'

const handler: DocsMockResponseHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: 'prj_2001',
      name: 'Project 2001',
      status: 'active',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      key: 'PRJ',
      visibility: 'private',
      repoUrl: 'https://git.example.com/prj',
    },
  }
}

export default handler
