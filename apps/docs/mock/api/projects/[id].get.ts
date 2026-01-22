import type { RequestHandler } from 'mokup'
import { faker } from '@faker-js/faker'

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
    id,
    name: displayValue,
    status: 'active',
    createdAt: faker.date.recent({ days: 90 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...defaults,
  }
}

export default handler
