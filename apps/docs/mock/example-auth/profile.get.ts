import type { RequestHandler } from 'mokup'

const handler: RequestHandler = () => {
  return {
    ok: true,
    user: {
      id: 'user_demo',
      name: 'Demo User',
      role: 'member',
    },
  }
}

export default handler
