import type { RequestHandler, RouteRule } from 'mokup'
import { user } from '../db/schema'

const handler: RequestHandler = async (c) => {
  const db = c.get('db')
  if (!db || typeof db.select !== 'function') {
    c.status(503)
    return {
      ok: false,
      message: 'D1 binding is not available.',
    }
  }
  const users = await db.select().from(user).all()
  return {
    ok: true,
    users,
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
